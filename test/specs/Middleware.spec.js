'use strict';
import FAST from '../../lib/FAST';
import {DopplerServer} from '../../lib/servers/Doppler';

describe('FAST APIs: ', () => {
  let fast;
  let context = {'app':'chromecast', 'app_version':'111111', 'user_id':'2000000671'};

  before(() => {
    fast = new FAST({
      production: false,
      source: 'playback'
    });
  });

  after(() => {
    fast = null;
  });

  describe('.setConfigs(): ', () => {
    it('should contains context', () => {
      fast.setConfigs({context: context});
      return assert.deepEqual(fast.configs.context, context);
    });

    it('should has a true production but not change source', () => {
      let source  = fast.configs.source;
      fast.setConfigs({production: true});
      assert.isTrue(fast.configs.production);
      assert.equal(fast.configs.source, source);
    });
  });

  describe('.doppler: ', () => {
    it('should be a DopplerServer instance', () => {
      return assert.instanceOf(fast.doppler, DopplerServer);
    });
  });
});
