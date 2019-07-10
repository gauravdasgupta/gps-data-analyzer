import Component from '@ember/component';
import {computed} from '@ember/object';
import moment from 'moment';

export default Component.extend({
    segmentsList: [],
    init(){
        this._super(...arguments);
    },

    columns: computed(function(){
      return ['Segment', 'Miles Covered', 'Time Taken', 'Started At', 'Up to'];
    }),

    totalMilesCovered: computed('allLocations', function(){
      let miles = Math.round(this.allLocations.reduce((a,b) => a + b.milesFromJobSite, 0));
      return miles+" miles";
    }),

    calculateSpeed(milesCovered, timeTaken){
      return milesCovered/timeTaken;
    },

    processWaitingSegments(label, color, waiting, dataChunk, milesCovered){
      if(!waiting){
        this.addToSegments(dataChunk,milesCovered,label,color);
      }
      else{
        this.mergeToLastSegment(dataChunk,milesCovered,label,color);
      }
    },

    processMovingSegments(label, color, moving, dataChunk, milesCovered){
      if(!moving){
        this.addToSegments(dataChunk,milesCovered,label,color);
      }
      else{
        this.mergeToLastSegment(dataChunk,milesCovered,label,color);
      }
    },

    mergeToLastSegment(dataChunk,milesCovered,label,color){
        let lastSegment = this.segmentsList.pop();
        let mergedChunk = [...lastSegment.locations,...dataChunk];
        this.addToSegments(mergedChunk,milesCovered,label,color);
    },

    segments: computed(function(){
      const minSpeed = 15;
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
          this.processWaitingSegments(label, color, waiting, dataChunk, milesCovered);
          waiting = true;
          moving = false;
        }
        else{
          let label = "moving";
          let color = "blue-box";
          this.processMovingSegments(label, color, moving, dataChunk, milesCovered);
          moving = true;
          waiting = false;
        }
      }
      return this.segmentsList;
    }),
    
    allLocations: computed(function(){
        let myData = this.get('input').data.attributes['relative-location-values'];
        let allLocations = [];
        let that = this;
        myData.forEach((entry) => {
          let loc = that.createLocation(entry[0], entry[1], entry[2], entry[3]);
          allLocations.pushObject(loc);
        });
        return allLocations;
      }),
    
      createLocation(at, latitude, longitude, milesFromJobSite) {
        return {
          at: at,
          latitude: latitude,
          longitude: longitude,
          milesFromJobSite: milesFromJobSite
        };
      },
    
      createSegment(name, totalMilesTravelled, totalTimeTaken, startTime, stopTime, locations, color) {
        return {
          name: name,
          totalMilesTravelled: totalMilesTravelled,
          totalTimeTaken: totalTimeTaken,
          startTime: startTime,
          stopTime: stopTime,
          locations: locations,
          color: color
        };
      },
    
      addToSegments(chunk,milesCovered,label,color){
                  let endAt = chunk[chunk.length - 1].at;
                  let startAt = chunk[0].at;
                  let endTime = startAt.replace(/T/g, ' ').replace(/Z/g, '');
                  let startTime = endAt.replace(/T/g, ' ').replace(/Z/g, '');
      
      
                  var duration = moment.duration(moment(startTime).diff(moment(endTime)));
                  var hours = duration.asHours();
                  let milesInSegment = milesCovered;
                  this.segmentsList.pushObject(
                  this.createSegment(label,
                  milesInSegment, hours,
                    startAt, endAt, chunk, color));
      }
});
