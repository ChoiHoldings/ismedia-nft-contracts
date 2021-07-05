const assert = require('assert');
const { expect } = require('chai');

const {
  ERC721_INTERFACE,
  AccessControlEnumerable_INTERFACE,
  ERC721Enumerable_INTERFACE,
  assertInterface,
  assertRole,
  assertNoRole,
  shouldRevert,
} = require('./helpers');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const URI = 'https://erc721.ismedia.com/data/';

describe('ERC721', function() {
  let token;
  let owner;
  let user1;
  let user2;
  let pauserRole;
  let minterRole;
  // Token ids in order for testing
  const id1 = '0';
  const id2 = '1';
  const id3 = '2';

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it('Deploy ERC721', async function() {
    const name = 'isMedia 721';
    const symbol = 'ISM721';

    const ERC721Factory = await ethers.getContractFactory('IsmediaERC721');
    token = await ERC721Factory.deploy(name, symbol, URI);

    //  Check name and symbol
    const contractName = await token.name();
    assert.strictEqual(name, contractName, 'Wrong name');
    const contractSymbol = await token.symbol();
    assert.strictEqual(symbol, contractSymbol, 'Wrong symol');

    // Check interface support
    await assertInterface(token, ERC721_INTERFACE);
    await assertInterface(token, AccessControlEnumerable_INTERFACE);
    await assertInterface(token, ERC721Enumerable_INTERFACE);
  });

  it('Checks owner admin/pauser/minter role', async function() {
    const adminRole = await token.DEFAULT_ADMIN_ROLE();
    minterRole = await token.MINTER_ROLE();
    pauserRole = await token.PAUSER_ROLE();

    await assertRole(token, pauserRole, owner);
    await assertRole(token, minterRole, owner);
    await assertRole(token, adminRole, owner);
  });

  it('Grants, revokes, and renounces roles', async function() {
    await assertNoRole(token, minterRole, user1);
    await token.connect(owner).grantRole(minterRole, user1.address);

    assertRole(token, minterRole, user1);

    // Can only renounce your own roles
    await shouldRevert(
      token.connect(owner).renounceRole(minterRole, user1.address),
      'AccessControl: can only renounce roles for self',
    );
    await token.connect(user1).renounceRole(minterRole, user1.address);
    await assertNoRole(token, minterRole, user1);

    await token.connect(owner).grantRole(minterRole, user1.address);
    await token.connect(owner).revokeRole(minterRole, user1.address);
    await assertNoRole(token, minterRole, user1);

    await token.connect(owner).grantRole(minterRole, user1.address);
  });

  it('Can mint', async function() {
    // Owner mints to user 1
    await expect(token.connect(owner).mint(user1.address))
      .to.emit(token, 'Transfer')
      .withArgs(ADDRESS_ZERO, user1.address, id1);

    const uri1 = await token.tokenURI(id1);
    assert.strictEqual(uri1, `${URI}${id1}`, 'URI does not match');

    const tokenOwner = await token.ownerOf(id1);
    assert.strictEqual(tokenOwner, user1.address, `Wrong owner of id=${id1}`);

    // Minter role, mint to self
    await expect(token.connect(user1).mint(user1.address))
      .to.emit(token, 'Transfer')
      .withArgs(ADDRESS_ZERO, user1.address, id2);

    // Mint to user2
    await expect(token.connect(user1).mint(user2.address))
      .to.emit(token, 'Transfer')
      .withArgs(ADDRESS_ZERO, user2.address, id3);

    expect(await token.totalSupply()).to.equal(3);
  });

  it('Can check ownership', async function() {
    expect(await token.tokenByIndex('0')).to.equal(id1);
    expect(await token.tokenByIndex('1')).to.equal(id2);

    expect(await token.tokenOfOwnerByIndex(user1.address, '0')).to.equal(id1);
    expect(await token.tokenOfOwnerByIndex(user1.address, '1')).to.equal(id2);
    expect(await token.tokenOfOwnerByIndex(user2.address, '0')).to.equal(id3);

    expect(await token.balanceOf(user1.address)).to.equal(2);
    expect(await token.balanceOf(user2.address)).to.equal(1);
  });

  it('Can transfer', async function() {
    expect(await token.getApproved(id1)).to.equal(ADDRESS_ZERO);
    expect(await token.getApproved(id2)).to.equal(ADDRESS_ZERO);
    expect(await token.getApproved(id3)).to.equal(ADDRESS_ZERO);

    await token.connect(user1).approve(user3.address, id1);
    await token.connect(user1).approve(user3.address, id2);
    await token.connect(user2).approve(user3.address, id3);

    expect(await token.getApproved(id1)).to.equal(user3.address);
    expect(await token.getApproved(id2)).to.equal(user3.address);
    expect(await token.getApproved(id3)).to.equal(user3.address);

    await token.connect(user3).transferFrom(user1.address, user3.address, id1);
    await token.connect(user3).transferFrom(user1.address, user3.address, id2);
    await token.connect(user3).transferFrom(user2.address, user3.address, id3);

    expect(await token.balanceOf(user1.address)).to.equal(0);
    expect(await token.balanceOf(user2.address)).to.equal(0);
    expect(await token.balanceOf(user3.address)).to.equal(3);
    expect(await token.totalSupply()).to.equal(3);
  });

  it('Can pause/unpause', async function() {
    await token.connect(user3).approve(user1.address, id3);

    expect(await token.paused()).false;

    // Non-pauser can't pause
    await shouldRevert(
      token.connect(user1).pause(),
      '',
    );

    // Can't transfer when paused
    await token.connect(owner).pause();
    expect(await token.paused()).true;
    await shouldRevert(
      token.connect(user3).approve(user1.address, id1),
      '',
    );
    await shouldRevert(
      token.connect(user1).transferFrom(user3.address, user1.address, id3),
      '',
    );

    await token.connect(owner).unpause();
    expect(await token.paused()).false;
  });

  it('Can burn', async function() {
    await token.connect(user3).burn(id2);

    expect(await token.balanceOf(user3.address)).to.equal(2);
    expect(await token.totalSupply()).to.equal(2);

    // Non-owner can't burn
    await shouldRevert(
      token.connect(owner).burn(id1),
      'ERC721Burnable: caller is not owner nor approved',
    );
  });

  it('Checks approval for all', async function() {
    // TODO
    /*
      isApprovedForAll
      setApprovalForAll
    */
  });
});
