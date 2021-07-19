const assert = require('assert');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

// 1 day in seconds
const DAY_S = 60 * 60 * 24;

const ERC721_INTERFACE = '0x80ac58cd';
const AccessControlEnumerable_INTERFACE = '0x5a05180f';
const ERC721Enumerable_INTERFACE = '0x780e9d63';
const ERC1155MetadataURI_INTERFACE = '0x0e89341c';
const ERC1155_INTERFACE = '0xd9b67a26';

const INTERFACE_NAMES = {
  [ERC721_INTERFACE]: 'ERC721',
  [AccessControlEnumerable_INTERFACE]: 'AccessControlEnumberable',
  [ERC721Enumerable_INTERFACE]: 'ERC721Enumerable',
  [ERC1155MetadataURI_INTERFACE]: 'IERC1155MetadataURI',
  [ERC1155_INTERFACE]: 'ERC1155',
};

async function assertInterface(token, interface) {
  const supported = await token.supportsInterface(interface);
  assert.ok(supported, `Does not support ${INTERFACE_NAMES[interface]}`);
}

async function assertRole(token, role, signer) {
  const has = await token.hasRole(role, signer.address);
  assert.ok(has, 'Missing role');
}

async function assertNoRole(token, role, signer) {
  const has = await token.hasRole(role, signer.address);
  assert.ok(!has, 'Has role');
}

const shouldRevert = async (action, expectedOutput, message) => {
  try {
    await action;
    assert.strictEqual(false, true, message);
  } catch(error) {
    assert.ok(
      error.message.includes(expectedOutput),
      `Expected: "${expectedOutput}"\n(${message || error.message}`,
    );
  }
};

async function blockTime() {
  return (await ethers.provider.getBlock('latest')).timestamp;
}

async function increaseTime(seconds) {
  const now = await blockTime();
  await ethers.provider.send('evm_increaseTime', [seconds]);
  await ethers.provider.send('evm_mine');
  return now + seconds;
}

module.exports = {
  ADDRESS_ZERO,
  DAY_S,
  ERC721_INTERFACE,
  AccessControlEnumerable_INTERFACE,
  ERC721Enumerable_INTERFACE,
  ERC1155MetadataURI_INTERFACE,
  ERC1155_INTERFACE,
  blockTime,
  increaseTime,
  assertInterface,
  assertRole,
  assertNoRole,
  shouldRevert,
};
