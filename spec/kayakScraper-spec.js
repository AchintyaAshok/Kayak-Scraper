var kayak = require(path.join(__dirname, '../lib/kayakScraper'));

describe('KayakScraper',function(){
  /* Test the formatted date function */
  describe('formattedDate', function(){
    it('should return 2016-10-01 for month greater than 10', function(){
      var formattedDate = kayak.getFormattedDate(new Date(2016, 10, 1));
      expect(formattedDate).toBe('2016-10-01');
    });
  })
});
