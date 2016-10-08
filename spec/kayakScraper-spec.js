var path = require('path');
var kayak = require(path.join(__dirname, '../lib/kayakScraper'));

describe('KayakScraper',function(){
  /* Test the formatted date function */
  describe('formattedDate', function(){
    it('should return 2016-10-01 for October 10th, 2016', function(){
      var formattedDate = kayak.getFormattedDate(new Date(2016, 9, 16)); // months are 0-indexed
      expect(formattedDate).toBe('2016-10-16');
    });
    it('should return zero-prefix for single digit month', function(){
      var formattedDate = kayak.getFormattedDate(new Date(2016, 8, 16));
      expect(formattedDate).toBe('2016-09-16');
    });
  })
});
