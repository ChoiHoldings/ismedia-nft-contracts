
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(
    `Deploying contracts to ${network.name} (${network.chainId}) with account: ${deployer.address}`,
    deployer.address,
  );

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const erc721Uri = 'https://nft.ismedia.com/erc721/';
  const erc1155Uri = 'https://nft.ismedia.com/erc1155/{id}';

  const erc721Factory = await ethers.getContractFactory('IsmediaERC721');
  const erc1155Factory = await ethers.getContractFactory('IsmediaERC1155');
  const marketFactory = await ethers.getContractFactory('IsmediaMarketV1');
  const erc721 = await erc721Factory.deploy('isMedia ERC721', 'ISM721', erc721Uri);
  const erc1155 = await erc1155Factory.deploy(erc1155Uri);
  const market = await marketFactory.deploy(erc721.address, erc1155.address);

  console.log('ERC721 address:', erc721.address);
  console.log('ERC1155 address:', erc1155.address);
  console.log('Market address:', market.address);

  // Transfer some ETH if we're on the local network
  if(network.chainId === 1337) {
    console.log('Granting roles');
    const testAddress = '0x15581c92DB672cC9316846aEF34DC46Ac95378c2';
    await deployer.sendTransaction({
      to: testAddress,
      value: ethers.utils.parseEther('1.0'),
    });
    const minterRole = await erc721.MINTER_ROLE();
    const pauserRole = await erc721.PAUSER_ROLE();
    await erc721.grantRole(minterRole, testAddress);
    await erc721.grantRole(pauserRole, testAddress);
    await erc1155.grantRole(minterRole, testAddress);
    await erc1155.grantRole(pauserRole, testAddress);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
