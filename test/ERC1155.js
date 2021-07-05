const assert = require('assert');
const { expect } = require('chai');
const {
  ERC1155_INTERFACE,
  AccessControlEnumerable_INTERFACE,
  ERC1155MetadataURI_INTERFACE,
  assertRole,
  assertInterface,
  assertNoRole,
  shouldRevert,
  ADDRESS_ZERO,
} = require('./helpers');

const URI = 'https://erc1155.ismedia.com/{id}'

describe('ERC1155', function() {
  let token;
  let owner;
  let user1;
  let user2;
  let pauserRole;
  let minterRole;
  const id1 = '0';
  const id2 = '1';
  const id3 = '0xfff';

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  /*
    balanceOf: [Function (anonymous)],
  balanceOfBatch: [Function (anonymous)],
  burn: [Function (anonymous)],
  burnBatch: [Function (anonymous)],
  isApprovedForAll: [Function (anonymous)],
  mint: [Function (anonymous)],
  mintBatch: [Function (anonymous)],
  pause: [Function (anonymous)],
  paused: [Function (anonymous)],
  safeBatchTransferFrom: [Function (anonymous)],
  safeTransferFrom: [Function (anonymous)],
  setApprovalForAll: [Function (anonymous)],
  unpause: [Function (anonymous)],
  */

  it('Deploy ERC1155', async function() {
    const ERC1155Factory = await ethers.getContractFactory('IsmediaERC1155');

    token = await ERC1155Factory.deploy(URI);

    expect(await token.uri(0)).to.equal(URI);

    // Check interface support
    await assertInterface(token, ERC1155_INTERFACE);
    await assertInterface(token, AccessControlEnumerable_INTERFACE);
    await assertInterface(token, ERC1155MetadataURI_INTERFACE);
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

  it('Can mint NFTs', async function() {
    const id1Amount = 1;
    const id2Amount = '10';
    const id3Amount = '10000000';

    // Owner mints an NFT token to user1
    expect(await token.connect(owner).mint(user1.address, id1, id1Amount, []))
      .to.emit(token, 'TransferSingle')
      .withArgs(owner.address, ADDRESS_ZERO, user1.address, id1, id1Amount);

    expect(await token.totalSupply(id1)).to.equal(id1Amount);
    expect(await token.balanceOf(user1.address, id1)).to.equal(id1Amount);

    // Minter role, mint 10 tokens to self
    expect(await token.connect(user1).mint(user1.address, id2, id2Amount, []))
      .to.emit(token, 'TransferSingle')
      .withArgs(user1.address, ADDRESS_ZERO, user1.address, id2, id2Amount);

    expect(await token.totalSupply(id2)).to.equal(id2Amount);
    expect(await token.balanceOf(user1.address, id2)).to.equal(id2Amount);

    // Mint to user2
    expect(await token.connect(user1).mint(user2.address, id3, id3Amount, []))
      .to.emit(token, 'TransferSingle')
      .withArgs(user1.address, ADDRESS_ZERO, user2.address, id3, id3Amount);

    expect(await token.totalSupply(id3)).to.equal(id3Amount);
    expect(await token.balanceOf(user2.address, id3)).to.equal(id3Amount);

    // Non-minter can't mint
    await shouldRevert(
      token.connect(user2).mint(user1.address, id1, id1Amount, []),
      'Minter role required',
    );
  });

});
