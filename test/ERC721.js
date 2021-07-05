const assert = require('assert');

const URI = 'https://erc721.ismedia.com'

describe('ERC721', function() {
  let token;
  let owner;

  before(async () => {
    [owner] = await ethers.getSigners();
  });

  it('Deploy ERC721', async function() {

    const ERC721Factory = await ethers.getContractFactory('IsmediaERC721');
    token = await ERC721Factory.deploy('isMedia 721', 'ISM721', URI);

    const supports721 = await token.supportsInterface('0x80ac58cd');
    assert.ok(supports721, 'Does not support ERC721 interface');

    // Check for AccessControlEnumberable interface support
    const supportsAccess = await token.supportsInterface('0x5a05180f');
    assert.ok(supportsAccess, 'Does not support AccessControlEnumerable interface');

    // Check for ERC721Enumberable interface support
    const supportsEnum = await token.supportsInterface('0x780e9d63');
    assert.ok(supportsAccess, 'Does not support ERC721 Enumerable interface');
  });

  it('Checks owner admin/pauser/minter role', async function() {
    const adminRole = await token.DEFAULT_ADMIN_ROLE();
    const minterRole = await token.MINTER_ROLE();
    const pauserRole = await token.PAUSER_ROLE();

    const isPauser = token.hasRole(pauserRole, owner.address);
    assert.ok(isPauser, 'Owner missing pauser role');

    const isMinter = token.hasRole(minterRole, owner.address);
    assert.ok(isMinter, 'Owner missing minter role');

    const isAdmin = token.hasRole(adminRole, owner.address);
    assert.ok(isAdmin, 'Owner missing admin role');
  });
});
