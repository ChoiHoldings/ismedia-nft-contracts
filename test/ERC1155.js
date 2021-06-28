const { expect } = require('chai');

describe('ERC1155', function() {
  it('Deploy ERC721', async function() {
    const [owner] = await ethers.getSigners();

    const ERC1155Factory = await ethers.getContractFactory('ERC1155PresetMinterPauser');
  });
});
