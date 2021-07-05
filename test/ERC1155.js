const assert = require('assert');

const URI = 'https://erc1155.ismedia.com'

describe('ERC1155', function() {
  let token;
  let owner;

  before(async () => {
    [owner] = await ethers.getSigners();
  });

  it('Deploy ERC1155', async function() {
    const ERC1155Factory = await ethers.getContractFactory('IsmediaERC1155');

    token = await ERC1155Factory.deploy(URI);

    // Check for AccessControlEnumberable interface support
    const supportsAccess = await token.supportsInterface('0x5a05180f');
    assert.ok(supportsAccess, 'Does not support AccessControlEnumerable interface');

    // Check for ERC1155 interface support
    const supports1155 = await token.supportsInterface('0xd9b67a26');
    assert.ok(supports1155, 'Does not support ERC1155 interface');

    // Check for IERC1155MetadataURI interface support
    const supportsMeta = await token.supportsInterface('0x0e89341c');
    assert.ok(supportsMeta, 'Does not support IERC1155MetadataURI interface');
  });
});
