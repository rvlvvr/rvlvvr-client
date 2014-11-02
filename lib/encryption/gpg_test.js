var assert = require('chai').assert;
var spawn = require('child_process').spawn;
var gpg = require('./gpg');


var describeIntegration = (process.env.HAS_GPG_KEYS) ? describe : describe.skip;


var validPGPMessage = ""+
  "-----BEGIN PGP MESSAGE-----\n" +
  "Version: GnuPG/MacGPG2 v2.0.19 (Darwin)\n" +
  "Comment: GPGTools - http://gpgtools.org\n" +
  "\n" +
  "hQIMA+KWby/SpuCAARAAga9Rn50EybeNK/FyN9DNhPDTLhb/gkuQSyzttxaRmUa7\n" +
  "c2he4WXU3oisHZLQleW1sy1qUBS0gSY9ujlSWGyZwnScpIBvoR4Of3se3rdwGH6+\n" +
  "2zfqfEn1IlqkiSqZb2IjqwhOr9NzolT35K6Qu2Z31pqz/U/gYeXNJ2j3Vt+EPKGP\n" +
  "H2R7Due1q7MMcJ/KXdnGYYX4nz4I16NBuohB5vLaT9UhJdWL0OED1pnh2w3vSzv/\n" +
  "li3DmXF8AGI/HOhQ2ghLu5WWliCjoyL0uFUa1q8UhDZRx6wEFYaNkIdcmEiz86fm\n" +
  "e6JQMG3Cs1IKR7w2kiIFivAtdG68uTePk3C+IT9cNOJDHtRdnuUi3XU2lhFTIEmM\n" +
  "c74lblZ10Y++htBo/ARfU/Zwzgm7gyg+OszuQycBM6EFoPrBUywa6Gq0Ckm+nRXH\n" +
  "U3b7B4pw9wdZEt/tzP/FZxAcwdkVKBZPaFWMu/4Zp+g6dzS5R9iuszWd5a0zYtd/\n" +
  "QB8BU3ngZuN+nz/MQkTmBGAgYhX+X3Jq9VjGs6iDd5gEMRuR7ch7kRjGmn+0kpwW\n" +
  "b0sivaEobBuH1HpAIauJf4UWHQbGj4WcBK/DEQCdMaG10zOA6WKo9xGeX4XlpUfd\n" +
  "U+mhrombiqKfC3ld/no6mgCBvhig1icEDMfrSiMFxrlS6PoAnmyJVAQcXMTnhWfS\n" +
  "PwEdevDGCqtgUhw2CX8ngWzaM1mO678tKn5QzPyjkQp4dIixFbnNR3QH+FleYlLT\n" +
  "n0hMyMzi5HF/xUhhUSnQSg==\n" +
  "=ukPJ\n" +
  "-----END PGP MESSAGE-----\n";

describe('gpg encryption', function () {
  describe('isGpGMessage', function () {
    it('should return true if the message is armored', function () {
      assert.isTrue(gpg.isGPGMessage(validPGPMessage));
    });
    it('should return false if message is not armored', function () {
      assert.isFalse(gpg.isGPGMessage('Not valid'));
    });
  });

  describeIntegration('end-to-end test @slow', function () {
    it('should encrypt things the other key can decrypt', function (done) {
      var originalString = "This is a test string for validation";
      msgObj = {
        text: originalString,
        pubKey: "key2@rvlvvr.net",
        encryptingUser: 'key1@rvlvvr.net'
      };
      gpg.encrypt(msgObj, msgObj.text, function (err, messageObj) {
        assert.isNull(err);
        assert.isTrue(gpg.isGPGMessage(messageObj.text));

        gpg.decrypt({
          text: messageObj.text
        }, function (err, text) {
          assert.isNull(err);
          assert.equal(originalString, text);
          done();
        });
      });
    });
  });
});
