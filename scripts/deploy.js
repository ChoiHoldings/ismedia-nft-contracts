const getFactories = async () => {
  const erc721Factory = await ethers.getContractFactory('IsmediaERC721');
  const erc1155Factory = await ethers.getContractFactory('IsmediaERC1155');
  const marketFactory = await ethers.getContractFactory('IsmediaMarketV1');
  return { erc721Factory, erc1155Factory, marketFactory };
};

const deployContracts = async ({ erc721Factory, erc1155Factory, marketFactory, erc721Uri, erc1155Uri }) => {
  const erc721 = await erc721Factory.deploy('isMedia ERC721', 'ISM721', erc721Uri);
  const erc1155 = await erc1155Factory.deploy(erc1155Uri);
  const market = await marketFactory.deploy(erc721.address, erc1155.address);
  return { erc721, erc1155, market };
};

const getTokens = async ({ erc721Address, erc1155Address, erc721Factory, erc1155Factory }) => {
  const erc721 = await erc721Factory.attach(erc721Address);
  const erc1155 = await erc1155Factory.attach(erc1155Address);
  return { erc721, erc1155 };
};

const printContractAddresses = ({ erc721, erc1155, market }) => {
  console.log('ERC721 address:', erc721.address);
  console.log('ERC1155 address:', erc1155.address);
  console.log('Market address:', market.address);
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(
    `Deploying contracts to ${network.name} (${network.chainId}) with account: ${deployer.address}`,
    deployer.address,
  );

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const erc721Uri = 'https://nft.goshen.media/erc721/';
  const erc1155Uri = 'https://nft.goshen.media/erc1155/{id}';

  const factories = await getFactories();

  // Transfer some ETH if we're on the local network
  if(network.chainId === 1337) {
    const { erc721, erc1155, market } = await deployContracts({
      ...factories,
      erc721Uri,
      erc1155Uri,
    });
    printContractAddresses({ erc721, erc1155, market });

    console.log('Granting roles');
    const testAddress = '0x15581c92DB672cC9316846aEF34DC46Ac95378c2';
    await deployer.sendTransaction({
      to: testAddress,
      value: ethers.utils.parseEther('5.0'),
    });
    const minterRole = await erc721.MINTER_ROLE();
    const pauserRole = await erc721.PAUSER_ROLE();
    await erc721.grantRole(minterRole, testAddress);
    await erc721.grantRole(pauserRole, testAddress);
    await erc1155.grantRole(minterRole, testAddress);
    await erc1155.grantRole(pauserRole, testAddress);
  } else if(network.chainId === 3) {
    /*
    const { erc721, erc1155, market } = await deployContracts({
      ...factories,
      erc721Uri,
      erc1155Uri,
    });
    */
    const erc721Address = '0x27739F40512aAb094D295A4972731091aF99E52c';
    const erc1155Address = '0xf08e889457611C3025d9077b04E2f88c5FBeeA14';
    const { erc721, erc1155 } = await getTokens({
      erc721Address,
      erc1155Address,
      ...factories,
    });
    const market = await factories.marketFactory.deploy(erc721.address, erc1155.address);
    printContractAddresses({ erc721, erc1155, market });

    const address1 = '0x67C0b32b8A8bf60AA23D77f76C11bA6409367491';
    const address2 = '0x0B31F66e8Df4B83a0f736935C0828b331FEA6EB2';
    const address3 = '0x5dBCC60bb53Aa3906D3154CFf69489555e780cc0';
    const minterRole = await erc721.MINTER_ROLE();
    await erc721.grantRole(minterRole, address1);
    await erc721.grantRole(minterRole, address2);
    await erc721.grantRole(minterRole, address3);
    /*
    await erc1155.grantRole(minterRole, address2);
    await erc1155.grantRole(minterRole, address1);
    */
    console.log('GRANTED ROLES');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
