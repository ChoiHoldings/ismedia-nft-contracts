const { expect } = require('chai');

describe('ERC721', function() {
  it('Deploy ERC721', async function() {
    const [owner] = await ethers.getSigners();

    const ERC721Factory = await ethers.getContractFactory('ERC721PresetMinterPauserAutoId');
  });
});
