const assert = require('assert');
const { expect } = require('chai');

const {
  shouldRevert,
  ADDRESS_ZERO,
} = require('./helpers');

const ERC721_URI = 'https://erc721.ismedia.com/data/';
const ERC1155_URI = 'https://erc1155.ismedia.com/{id}';

describe('isMedia Sale Contract', function() {
  let token;
  let owner;
  let user1;
  let user2;
  let user3;
  // Token ids
  const id1 = '0';
  const id2 = '1';
  const id3 = '2';

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it('Deploy Tokens and Market', async function() {
  });

});