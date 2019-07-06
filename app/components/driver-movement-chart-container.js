import Component from '@ember/component';
import EmberObject, {computed} from '@ember/object';
import moment from 'moment';

export default Component.extend({
    locVals: '',
    segmentsList: [],
    columns: [],
    init(){
        this._super(...arguments);
        this.locVals = this.get('input').data.attributes['relative-location-values'];
        const cols = ['Segment', 'Miles Covered', 'Time Taken', 'Started At', 'Up to'];
        const [segment, milesCovered, timeTaken, startedAt, upto] = cols;
        this.columns = cols;
    },

    totalMilesCovered: computed('allLocations', function(){
      let miles = Math.round(this.allLocations.reduce((a,b) => a + b.milesFromJobSite, 0));
      return miles+" miles";
    }),

    calculateSpeed(milesCovered, timeTaken){
      return milesCovered/timeTaken;
    },

    processWaitingSegments(Segment, label, color, waiting, dataChunk, milesCovered){
      if(!waiting){
        this.addToSegments(Segment,dataChunk,milesCovered,label,color);
      }
      else{
        this.mergeToLastSegment(dataChunk,Segment,milesCovered,label,color);
      }
    },

    processMovingSegments(Segment, label, color, moving, dataChunk, milesCovered){
      if(!moving){
        this.addToSegments(Segment,dataChunk,milesCovered,label,color);
      }
      else{
        this.mergeToLastSegment(dataChunk,Segment,milesCovered,label,color);
      }
    },

    mergeToLastSegment(dataChunk,Segment,milesCovered,label,color){
        let lastSegment = this.segmentsList.pop();
        let mergedChunk = [...lastSegment.locations,...dataChunk];
        this.addToSegments(Segment,mergedChunk,milesCovered,label,color);
    },

    segments: computed(function(){
      const Segment = EmberObject.extend({});
      const minSpeed = 15; //mph
      let allLocations = this.allLocations;
      let waiting = false;
      let moving = false;
      //Take out chunks of 5 mins each
      while(allLocations.length>0){
        let dataChunk = allLocations.splice(0,5);
        let milesCovered = dataChunk.reduce((a,b) => a + b.milesFromJobSite, 0);
        
        let endAt = dataChunk[dataChunk.length - 1].at;
        let startAt = dataChunk[0].at;
        let endTime = startAt.replace(/T/g, ' ').replace(/Z/g, '');
        let startTime = endAt.replace(/T/g, ' ').replace(/Z/g, '');
        let duration = moment.duration(moment(startTime).diff(moment(endTime)));
        let timeTaken = duration.asHours();

        let speed = this.calculateSpeed(milesCovered, timeTaken);
        if(speed<=minSpeed){
          let label = "waiting";
          let color = "red-box";
          this.processWaitingSegments(Segment, label, color, waiting, dataChunk, milesCovered);
          waiting = true;
          moving = false;
        }
        else{
          let label = "moving";
          let color = "blue-box";
          this.processMovingSegments(Segment, label, color, moving, dataChunk, milesCovered);
          moving = true;
          waiting = false;
        }
      }
      return this.segmentsList;
    }),
    
    allLocations: computed(function(){
        let myData = this.locVals;
        let allLocations = [];
        const Location = EmberObject.extend({});
        let that = this;
        myData.forEach((entry) => {
          let loc = that.createLocation(Location, entry[0], entry[1], entry[2], entry[3]);
          allLocations.pushObject(loc);
        });
        return allLocations;
      }),
    
      createLocation(Location, at, latitude, longitude, milesFromJobSite) {
        return Location.create({
          at: at,
          latitude: latitude,
          longitude: longitude,
          milesFromJobSite: milesFromJobSite
        });
      },
    
      createSegment(Segment, name, totalMilesTravelled, totalTimeTaken, startTime, stopTime, locations, color) {
        return Segment.create({
          name: name,
          totalMilesTravelled: totalMilesTravelled,
          totalTimeTaken: totalTimeTaken,
          startTime: startTime,
          stopTime: stopTime,
          locations: locations,
          color: color
        });
      },
    
      addToSegments(Segment,chunk,milesCovered,label,color){
                  let endAt = chunk[chunk.length - 1].at;
                  let startAt = chunk[0].at;
                  let endTime = startAt.replace(/T/g, ' ').replace(/Z/g, '');
                  let startTime = endAt.replace(/T/g, ' ').replace(/Z/g, '');
      
      
                  var duration = moment.duration(moment(startTime).diff(moment(endTime)));
                  var hours = duration.asHours();
                  let milesInSegment = milesCovered;
                  this.segmentsList.pushObject(
                  this.createSegment(Segment, label,
                  milesInSegment, hours,
                    startAt, endAt, chunk, color));
      }
});
