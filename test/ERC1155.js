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

const URI = 'https://erc1155.ismedia.com/{id}';

describe('ERC1155', function() {
  let token;
  let owner;
  let user1;
  let user2;
  let user3;
  let pauserRole;
  let minterRole;
  const id1 = '0';
  const id2 = '1';
  const id3 = '0xfff';
  const id1Amount = 1;
  const id2Amount = '10';
  const id3Amount = '10000000';

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

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

  it('Can pause/unpause', async function() {
    expect(await token.paused()).false;

    // Non-pauser can't pause
    await shouldRevert(
      token.connect(user1).pause(),
      'Pause role required',
    );

    // Can approve but not transfer when paused
    await token.connect(owner).pause();
    expect(await token.paused()).true;

    await shouldRevert(
      token.connect(user1).safeTransferFrom(user1.address, user3.address, id2, 1, []),
      'Paused',
    );

    await token.connect(owner).unpause();
    expect(await token.paused()).false;
  });

  it('Can transfer', async function() {
    // Can't transfer more than balance
    await shouldRevert(
      token.connect(user1).safeTransferFrom(user1.address, user3.address, id1, 2, []),
      'ERC1155: insufficient balance for transfer',
    );
    // Non-owner can't transfer
    await shouldRevert(
      token.connect(user2).safeTransferFrom(user1.address, user3.address, id1, 1, []),
      'ERC1155: caller is not owner nor approved',
    );

    await token.connect(user1).safeTransferFrom(user1.address, user3.address, id1, id1Amount, []);
    await token.connect(user1).safeTransferFrom(user1.address, user3.address, id2, id2Amount, []);
    await token.connect(user2).safeTransferFrom(user2.address, user3.address, id3, id3Amount, []);

    expect(await token.balanceOf(user3.address, id1)).to.equal(id1Amount);
    expect(await token.balanceOf(user3.address, id2)).to.equal(id2Amount);
    expect(await token.balanceOf(user3.address, id3)).to.equal(id3Amount);
  });

  it('Can grant approval and transfer', async function() {
    expect(await token.isApprovedForAll(user3.address, user1.address)).false;
    await token.connect(user3).setApprovalForAll(user1.address, true);
    expect(await token.isApprovedForAll(user3.address, user1.address)).true;

    await token.connect(user1).safeTransferFrom(user3.address, user2.address, id3, id3Amount, []);
    expect(await token.balanceOf(user2.address, id3)).to.equal(id3Amount);

    await token.connect(user3).setApprovalForAll(user1.address, false);
    expect(await token.isApprovedForAll(user3.address, user1.address)).false;
  });

  it('Can mint batches', async function() {
    // TODO
    // balanceOfBatch
    // mintBatch
  });

  it('Can transfer batches', async function() {
    // TODO
    // safeBatchTransferFrom
  });

  it('Can burn', async function() {
    await token.connect(user3).burn(user3.address, id2, '10');

    expect(await token.balanceOf(user3.address, id2)).to.equal(0);
    expect(await token.totalSupply(id2)).to.equal(0);

    // Can't burn more than exist
    await shouldRevert(
      token.connect(user2).burn(user2.address, id1, 2),
      'ERC1155: burn amount exceeds balance',
    );

    // Non-owner can't burn
    await shouldRevert(
      token.connect(user2).burn(user3.address, id1, '1'),
      'ERC1155: caller is not owner nor approved',
    );

    // TODO burnBatch
  });

});
