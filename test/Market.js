const assert = require('assert');
const { expect } = require('chai');

const {
  shouldRevert,
  ADDRESS_ZERO,
} = require('./helpers');

const ERC721_URI = 'https://erc721.ismedia.com/data/';
const ERC1155_URI = 'https://erc1155.ismedia.com/{id}';

// IsmediaMarketV1 TokenType enum
const SALE_ERC721 = 0;
const SALE_ERC1155 = 1;

// IsmediaMarketV1 SaleStatus enum
const SALE_ACTIVE = 0;
const SALE_COMPLETE = 1;
const SALE_CANCELED = 2;
const SALE_TIMEOUT = 3;

describe('isMedia Sale Contract', function() {
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
  // Token ids
  const id1 = '0';
  const id2 = '1';
  const id3 = '2';
  const price1 = ethers.utils.parseEther('100');
  const price2 = ethers.utils.parseEther('5');

  const assertStatus = async (saleId, expectedStatus) => {
    expect(await market.saleStatus(saleId))
      .to.equal(expectedStatus);
  };

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it('Deploy Tokens and Market', async function() {

    const ERC721Factory = await ethers.getContractFactory('IsmediaERC721');
    erc721 = await ERC721Factory.deploy('isMedia 721', 'ISM721', ERC721_URI);

    const ERC1155Factory = await ethers.getContractFactory('IsmediaERC1155');
    erc1155 = await ERC1155Factory.deploy(ERC1155_URI);

    const MarketFactory = await ethers.getContractFactory('IsmediaMarketV1');
    market = await MarketFactory.deploy(erc721.address, erc1155.address);
  });

  it('Posts and buys an ERC721 sale', async function() {
    // Mint an ERC721 token
    expect(await erc721.connect(owner).mint(user1.address))
      .to.emit(erc721, 'Transfer')
      .withArgs(ADDRESS_ZERO, user1.address, id1);

    const uri1 = await erc721.tokenURI(id1);
    assert.strictEqual(uri1, `${ERC721_URI}${id1}`, 'URI does not match');
    id1Owner = await erc721.ownerOf(id1);
    assert.strictEqual(id1Owner, user1.address, 'Wrong owner after mint');

    // Cannot post before approval
    await shouldRevert(
      market.connect(user1).postERC721(id1, price1),
      "Not approved",
    );

    // Approve market for transfer
    await erc721.connect(user1).approve(market.address, id1);

    // Post the sale
    expect(await market.connect(user1).postERC721(id1, price1))
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
      .to.emit(market, 'Purchase')
      .withArgs(user2.address, user1.address, id1, sale1, erc721.address, SALE_ERC721);

    id1Owner = await erc721.ownerOf(id1);
    assert.strictEqual(id1Owner, user2.address, 'Wrong owner after purchase');

    await assertStatus(sale1, SALE_COMPLETE);
  });

  it('Posts and buys an ERC1155 sale', async function() {
    // Mint an ERC721 token
    expect(await erc1155.connect(owner).mint(user1.address, id1, '10', []))
      .to.emit(erc1155, 'TransferSingle')
      .withArgs(owner.address, ADDRESS_ZERO, user1.address, id1, '10');

    expect(await erc1155.balanceOf(user1.address, id1)).to.equal('10');

    // Cannot post before approval
    await shouldRevert(
      market.connect(user1).postERC1155(id1, price2, '5'),
      "Not approved",
    );

    // Approve market for transfer
    await erc1155.connect(user1).setApprovalForAll(market.address, true);

    // Post the sale
    expect(await market.connect(user1).postERC1155(id1, price2, '5'))
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
      .withArgs(user2.address, user1.address, id1, sale2, erc1155.address, SALE_ERC1155);

    expect(await erc1155.balanceOf(user1.address, id1)).to.equal('9');
    expect(await erc1155.balanceOf(user2.address, id1)).to.equal('1');
    await assertStatus(sale2, SALE_ACTIVE);

    // Purchase 4 with too much ETH
    const initialEth = await ethers.provider.getBalance(user2.address);
    await market.connect(user2).buy(
      sale2,
      '4',
      { value: ethers.utils.parseEther('100'), gasPrice: 0 }
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

  it('Pauses and unpauses', async function() {
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
      market.connect(user1).postERC721(id1, price1),
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

  it('Cancels sale checks status', async function() {
    await erc721.connect(user2).approve(market.address, id1);

    // Post the sale
    expect(await market.connect(user2).postERC721(id1, price1))
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

  it('Checks sale expiration', async function() {

  });

  it('Checks error conditions', async function() {

  });
  /*
    tokenFromType
    buy
    cancel
    saleStatus
  */
});