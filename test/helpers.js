const assert = require('assert');

const ERC721_INTERFACE = '0x80ac58cd';
const AccessControlEnumerable_INTERFACE = '0x5a05180f';
const ERC721Enumerable_INTERFACE = '0x780e9d63';

const INTERFACE_NAMES = {
  [ERC721_INTERFACE]: 'ERC721',
  [AccessControlEnumerable_INTERFACE]: 'AccessControlEnumberable',
  [ERC721Enumerable_INTERFACE]: 'ERC721Enumerable',
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
      `Expected: "${expectedOutput}" - (${message}`,
    );
  }
};

module.exports = {
  ERC721_INTERFACE,
  AccessControlEnumerable_INTERFACE,
  ERC721Enumerable_INTERFACE,
  assertInterface,
  assertRole,
  assertNoRole,
  shouldRevert,
};
