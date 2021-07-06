// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./zeppelin/ERC721PresetMinterPauserAutoId.sol";
import "./zeppelin/ERC1155PresetMinterPauser.sol";

/// @title isMedia NFT Manager
/// @author SamaTech
/// @notice Manager for handling ERC1155 and ERC721 NFTs
contract TokenManager {

    /// ERC721 contract for minting and storage
    ERC721PresetMinterPauserAutoId public erc721;

    /// ERC1155 contract for minting and storage
    ERC1155PresetMinterPauser public erc1155;

    constructor(address _erc721, address _erc1155) {
        erc721 = ERC721PresetMinterPauserAutoId(_erc721);
        erc1155 = ERC1155PresetMinterPauser(_erc1155);

        // TODO determine whether to use this wrapper, or ERCX contracts directly
    }
}
