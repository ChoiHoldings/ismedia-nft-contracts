const { expect } = require('chai');

describe('Token Manager', function() {
  it('Deploy TokenManager', async function() {
    const [owner] = await ethers.getSigners();

    const TMFactory = await ethers.getContractFactory('TokenManager');
  });
});
