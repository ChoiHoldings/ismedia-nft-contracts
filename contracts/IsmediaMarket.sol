// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./zeppelin/Pausable.sol";
import "./zeppelin/Ownable.sol";
import "./IsmediaERC721.sol";
import "./IsmediaERC1155.sol";

contract IsmediaMarketV1 is Pausable, Ownable {

    event Purchase(
        address indexed buyer,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 saleId,
        address tokenContract,
        uint8 tokenType
    );

    event SaleCreated(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 saleId,
        address tokenContract,
        uint8 tokenType
    );

    event SaleCancelled(
        address indexed seller,
        uint256 indexed tokenId,
        address tokenContract,
        uint8 tokenType
    );

    enum SaleStatus {
        Active,
        Complete,
        Canceled,
        Timeout
    }

    enum TokenType {
        ERC721,
        ERC1155
    }

    struct TokenSale {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
        uint256 end;
        TokenType tokenType;
        SaleStatus status;
    }

    IsmediaERC721 public erc721;
    IsmediaERC1155 public erc1155;
    mapping(uint256 => TokenSale) public sales;
    uint256 public saleCounter = 0;

    constructor(address erc721Address, address erc1155Address) {
        erc721 = IsmediaERC721(erc721Address);
        erc1155 = IsmediaERC1155(erc1155Address);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function tokenFromType(uint8 tokenType) public view returns(address) {
        if(tokenType == uint8(TokenType.ERC1155)) {
            return address(erc1155);
        } else if(tokenType == uint8(TokenType.ERC721)) {
            return address(erc721);
        }
        revert("Invalid token type");
    }

    function buy(uint256 saleId) public payable whenNotPaused() {
        TokenSale storage sale = sales[saleId];
        require(msg.value >= sale.price, "Payment low");
        require(sale.status == SaleStatus.Active, "Sale inactive");

        sale.status = SaleStatus.Complete;
        address tokenAddress = tokenFromType(uint8(sale.tokenType));

        if(sale.tokenType == TokenType.ERC721) {
            erc721.safeTransferFrom(sale.seller, msg.sender, sale.tokenId);
        } else {
            erc1155.safeTransferFrom(sale.seller, msg.sender, sale.tokenId, sale.quantity, "");
        }
        payable(sale.seller).transfer(msg.value);
        emit Purchase(
            msg.sender,
            sale.seller,
            sale.tokenId,
            saleId,
            tokenAddress,
            uint8(sale.tokenType)
        );
    }

    function _post(uint256 tokenId, uint256 price, uint256 quantity, TokenType tokenType) private {
        uint256 saleId = saleCounter + 1;
        TokenSale storage sale = sales[saleId];
        address tokenAddress = tokenFromType(uint8(tokenType));

        if(tokenType == TokenType.ERC721) {
            require(msg.sender == erc721.ownerOf(tokenId), "Not token owner");
        } else {
            require(erc1155.balanceOf(msg.sender, tokenId) >= quantity, "Not enough tokens");
        }
        sale.seller = msg.sender;
        sale.tokenId = tokenId;
        sale.price = price;
        sale.quantity = quantity;
        sale.tokenType = tokenType;
        sale.status = SaleStatus.Active;

        saleCounter += 1;

        emit SaleCreated(
            msg.sender,
            tokenId,
            saleId,
            tokenAddress,
            uint8(tokenType)
        );
    }

    function postERC1155(uint256 tokenId, uint256 price, uint256 quantity) public whenNotPaused() {
        _post(tokenId, price, quantity, TokenType.ERC1155);
    }

    function postERC721(uint256 tokenId, uint256 price) public whenNotPaused() {
        _post(tokenId, price, 1, TokenType.ERC721);
    }

    function cancel(uint256 saleId) public whenNotPaused() {
        TokenSale storage sale = sales[saleId];
        require(sale.seller == msg.sender, "Only sale owner");
        require(sale.status == SaleStatus.Active, "Sale inactive");

        address tokenAddress = tokenFromType(uint8(sale.tokenType));

        sale.status = SaleStatus.Canceled;

        emit SaleCancelled(
            sale.seller,
            sale.tokenId,
            tokenAddress,
            uint8(sale.tokenType)
        );
    }

    function saleStatus(uint256 saleId) external view returns(uint8) {
        return uint8(sales[saleId].status);
    }
}