import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | driver-movement-analysis', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:driver-movement-analysis');
    assert.ok(route);
  });
});
