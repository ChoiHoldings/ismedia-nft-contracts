const assert = require('assert');
const { expect } = require('chai');

const {
  blockTime,
  increaseTime,
  shouldRevert,
  ADDRESS_ZERO,
  DAY_S,
} = require('./helpers');

const ERC721_URI = 'https://erc721.ismedia.com/data/';
const ERC1155_URI = 'https://erc1155.ismedia.com/{id}';

// IsmediaMarketV1 TokenType enum
const SALE_ERC721 = 0;
const SALE_ERC1155 = 1;

// IsmediaMarketV1 SaleStatus enum
const SALE_PENDING = '0';
const SALE_ACTIVE = '1';
const SALE_COMPLETE = '2';
const SALE_CANCELED = '3';
const SALE_TIMEOUT = '4';

const STATUS_STR = {
  [SALE_PENDING]: 'SALE_PENDING',
  [SALE_ACTIVE]: 'SALE_ACTIVE',
  [SALE_COMPLETE]: 'SALE_COMPLETE',
  [SALE_CANCELED]: 'SALE_CANCELED',
  [SALE_TIMEOUT]: 'SALE_TIMEOUT',
};

describe('isMedia Sale Contract', () => {
  let erc721;
  let erc1155;
  let market;
  let owner;
  let user1;
  let user2;
  let user3;
  // Expected sale IDs
  const sale1 = '0';
  const sale2 = '1';
  const sale3 = '2';
  const sale4 = '3';
  const sale5 = '4';
  const sale6 = '5';
  const sale7 = '6';
  // Token ids
  const id1 = '0';
  const id2 = '1';
  const price1 = ethers.utils.parseEther('100');
  const price2 = ethers.utils.parseEther('5');

  const assertStatus = async (saleId, expectedStatus) => {
    const status = (await market.saleStatus(saleId)).toString();
    assert.strictEqual(
      status, expectedStatus,
      `Expected ${STATUS_STR[expectedStatus]}, got ${STATUS_STR[status]}`,
    );
  };

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it('Deploy Tokens and Market', async () => {
    const ERC721Factory = await ethers.getContractFactory('IsmediaERC721');
    erc721 = await ERC721Factory.deploy('isMedia 721', 'ISM721', ERC721_URI);

    const ERC1155Factory = await ethers.getContractFactory('IsmediaERC1155');
    erc1155 = await ERC1155Factory.deploy(ERC1155_URI);

    const MarketFactory = await ethers.getContractFactory('IsmediaMarketV1');
    market = await MarketFactory.deploy(erc721.address, erc1155.address);
  });

  it('Posts and buys an ERC721 sale', async () => {
    // Mint an ERC721 token
    expect(await erc721.connect(owner).mint(user1.address, id1))
      .to.emit(erc721, 'Transfer')
      .withArgs(ADDRESS_ZERO, user1.address, id1);

    const uri1 = await erc721.tokenURI(id1);
    assert.strictEqual(uri1, `${ERC721_URI}${id1}`, 'URI does not match');
    let id1Owner = await erc721.ownerOf(id1);
    assert.strictEqual(id1Owner, user1.address, 'Wrong owner after mint');

    // Cannot post before approval
    await shouldRevert(
      market.connect(user1).postERC721(id1, price1, '0', '0'),
      'Not approved',
    );

    // Approve market for transfer
    await erc721.connect(user1).approve(market.address, id1);

    // Post the sale
    expect(await market.connect(user1).postERC721(id1, price1, '0', '0'))
      .to.emit(market, 'SaleCreated')
      .withArgs(user1.address, id1, sale1, erc721.address, SALE_ERC721);

    await assertStatus(sale1, SALE_ACTIVE);

    // Purchase without payment/with low payment
    await shouldRevert(market.connect(user2).buy(sale1, '1'), 'Payment low');
    await shouldRevert(
      market.connect(user2).buy(sale1, '1', { value: ethers.utils.parseEther('99') }),
      'Payment low',
    );
    await shouldRevert(
      market.connect(user2).buy(sale1, '2', { value: price1.mul('2').toString() }),
      'Quantity high',
    );

    expect(await market.connect(user2).buy(sale1, '1', { value: price1 }))
      .to.changeEtherBalance(user2, price1.mul(-1))
      .to.emit(market, 'Purchase')
      .withArgs(user2.address, id1, sale1, user1.address, erc721.address, SALE_ERC721);

    id1Owner = await erc721.ownerOf(id1);
    assert.strictEqual(id1Owner, user2.address, 'Wrong owner after purchase');

    await assertStatus(sale1, SALE_COMPLETE);
  });

  it('Posts and buys an ERC1155 sale', async () => {
    // Mint an ERC721 token
    expect(await erc1155.connect(owner).mint(user1.address, id1, '10', []))
      .to.emit(erc1155, 'TransferSingle')
      .withArgs(owner.address, ADDRESS_ZERO, user1.address, id1, '10');

    expect(await erc1155.balanceOf(user1.address, id1)).to.equal('10');

    // Cannot post before approval
    await shouldRevert(
      market.connect(user1).postERC1155(id1, price2, '5', '0', '0'),
      'Not approved',
    );

    // Approve market for transfer
    await erc1155.connect(user1).setApprovalForAll(market.address, true);

    // Post the sale
    expect(await market.connect(user1).postERC1155(id1, price2, '5', '0', '0'))
      .to.emit(market, 'SaleCreated')
      .withArgs(user1.address, id1, sale2, erc1155.address, SALE_ERC1155);

    await assertStatus(sale2, SALE_ACTIVE);

    // Purchase without payment/with low payment
    await shouldRevert(market.connect(user2).buy(sale2, '5'), 'Payment low');
    await shouldRevert(
      market.connect(user2).buy(sale2, '5', { value: ethers.utils.parseEther('24') }),
      'Payment low',
    );
    await shouldRevert(
      market.connect(user2).buy(sale2, '11', { value: ethers.utils.parseEther('500') }),
      'Quantity high',
    );

    // Purchase 1
    expect(await market.connect(user2).buy(sale2, '1', { value: price2 }))
      .to.emit(market, 'Purchase')
      .withArgs(user2.address, id1, sale2, user1.address, erc1155.address, SALE_ERC1155);

    expect(await erc1155.balanceOf(user1.address, id1)).to.equal('9');
    expect(await erc1155.balanceOf(user2.address, id1)).to.equal('1');
    await assertStatus(sale2, SALE_ACTIVE);

    // Purchase 4 with too much ETH
    const initialEth = await ethers.provider.getBalance(user2.address);
    await market.connect(user2).buy(
      sale2,
      '4',
      { value: ethers.utils.parseEther('100'), gasPrice: 0 },
    );

    expect(await erc1155.balanceOf(user1.address, id1)).to.equal('5');
    expect(await erc1155.balanceOf(user2.address, id1)).to.equal('5');

    await assertStatus(sale2, SALE_COMPLETE);
    const purchasePrice = price2.mul('4');
    const finalEth = await ethers.provider.getBalance(user2.address);
    assert.strictEqual(
      initialEth.sub(purchasePrice).toString(),
      finalEth.toString(),
      'Purchase price does not match wallet difference',
    );
  });

  it('Pauses and unpauses', async () => {
    // Only PAUSER can pause
    await shouldRevert(
      market.connect(user1).pause(),
      'Only owner',
    );

    // Pause the market
    await market.connect(owner).pause();
    expect(await market.paused()).to.equal(true);

    // Cannot post or buy while paused
    await shouldRevert(
      market.connect(user2).buy(sale2, '1', { value: price2 }),
      'Paused',
    );
    await shouldRevert(
      market.connect(user1).postERC721(id1, price1, '0', '0'),
      'Paused',
    );

    // Only PAUSER can unpause
    await shouldRevert(
      market.connect(user1).unpause(),
      'Only owner',
    );
    // Unpause the market
    await market.connect(owner).unpause();
    expect(await market.paused()).to.equal(false);
  });

  it('Cancels sale checks status', async () => {
    await erc721.connect(user2).approve(market.address, id1);

    // Post the sale
    expect(await market.connect(user2).postERC721(id1, price1, '0', '0'))
      .to.emit(market, 'SaleCreated')
      .withArgs(user2.address, id1, sale3, erc721.address, SALE_ERC721);

    // Non-poster can't cancel
    await shouldRevert(
      market.connect(user1).cancel(sale3),
      'Only sale owner',
    );
    // Can't cancel completed sale
    await shouldRevert(
      market.connect(user1).cancel(sale1),
      'Sale inactive',
    );

    // Cancel and check status
    await market.connect(user2).cancel(sale3);

    assertStatus(sale3, SALE_CANCELED);

    // Can't buy canceled sale
    await shouldRevert(
      market.connect(user1).buy(sale3, '1', { value: price1 }),
      'Sale inactive',
    );
  });

  it('Checks sale expiration', async () => {
    // End the sale in 2 days
    const now = await blockTime();
    const end = (now + (DAY_S * 2)).toString();
    expect(await market.connect(user2).postERC721(id1, price1, '0', end))
      .to.emit(market, 'SaleCreated')
      .withArgs(user2.address, id1, sale4, erc721.address, SALE_ERC721);

    assertStatus(sale4, SALE_ACTIVE);
    await increaseTime(3 * DAY_S);
    assertStatus(sale4, SALE_TIMEOUT);

    // Can't buy a timed out sale
    await shouldRevert(
      market.connect(user1).buy(sale4, '1', { value: price1 }),
      'Sale inactive',
    );
  });

  it('Checks sale delayed post', async () => {
    // Post the sale in 2 days
    const now = await blockTime();
    const start = (now + (DAY_S * 2)).toString();
    expect(await market.connect(user2).postERC721(id1, price1, start, '0'))
      .to.emit(market, 'SaleCreated')
      .withArgs(user2.address, id1, sale5, erc721.address, SALE_ERC721);

    // Can't buy a pending sale
    await shouldRevert(
      market.connect(user1).buy(sale5, '1', { value: price1 }),
      'Sale inactive',
    );

    assertStatus(sale5, SALE_PENDING);
    await increaseTime(3 * DAY_S);
    assertStatus(sale5, SALE_ACTIVE);

    // Can buy after the sale is active
    expect(await market.connect(user3).buy(sale5, '1', { value: price1 }))
      .to.emit(market, 'Purchase')
      .withArgs(user3.address, id1, sale5, user2.address, erc721.address, SALE_ERC721);
  });

  it('Checks delay and expiration together', async () => {
    // Post the sale in 2 days, end in 4 days
    const now = await blockTime();
    const start = (now + (DAY_S * 2)).toString();
    const end = (now + (DAY_S * 4)).toString();

    await erc1155.connect(user2).setApprovalForAll(market.address, true);
    expect(await market.connect(user2).postERC1155(id1, price1, '5', start, end))
      .to.emit(market, 'SaleCreated')
      .withArgs(user2.address, id1, sale6, erc1155.address, SALE_ERC1155);

    // Can't buy a pending sale
    await shouldRevert(
      market.connect(user1).buy(sale6, '1', { value: price1 }),
      'Sale inactive',
    );

    assertStatus(sale6, SALE_PENDING);
    await increaseTime(3 * DAY_S);
    assertStatus(sale6, SALE_ACTIVE);

    // Can buy
    expect(await market.connect(user3).buy(sale6, '1', { value: price1 }))
      .to.emit(market, 'Purchase')
      .withArgs(user3.address, id1, sale6, user2.address, erc1155.address, SALE_ERC1155);

    await increaseTime(3 * DAY_S);
    assertStatus(sale6, SALE_TIMEOUT);

    // Can't buy a timed out sale
    await shouldRevert(
      market.connect(user1).buy(sale6, '1', { value: price1 }),
      'Sale inactive',
    );
  });

  it('Tests ERC721 quantity hack', async () => {
    // Mint an ERC721 token
    expect(await erc721.connect(owner).mint(user1.address, id2))
      .to.emit(erc721, 'Transfer')
      .withArgs(ADDRESS_ZERO, user1.address, id2);

    const uri1 = await erc721.tokenURI(id2);
    assert.strictEqual(uri1, `${ERC721_URI}${id2}`, 'URI does not match');
    const id2Owner = await erc721.ownerOf(id2);
    assert.strictEqual(id2Owner, user1.address, 'Wrong owner after mint');

    // Approve market for transfer
    await erc721.connect(user1).approve(market.address, id2);

    // Post the sale
    expect(await market.connect(user1).postERC721(id2, price1, '0', '0'))
      .to.emit(market, 'SaleCreated')
      .withArgs(user1.address, id2, sale7, erc721.address, SALE_ERC721);

    // ERC721 quantity must be 1
    await shouldRevert(
      market.connect(user1).buy(sale7, '0', { value: price1 }),
      'Quantity low',
    );
    await shouldRevert(
      market.connect(user2).buy(sale7, '2', { value: price1.mul('2') }),
      'Quantity high',
    );
    await assertStatus(sale7, SALE_ACTIVE);
  });
});
