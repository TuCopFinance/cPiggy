// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract cPiggyBank is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PiggyDeposit {
        uint256 amount;         // Original cCOP deposited
        uint256 startTime;      // deposit time
        uint256 unlockTime;     // when user can claim tokens back
        uint256 duration;       // lock period in seconds
        bool claimed;           // whether it is withdrawn or not
        bool safeMode;          // if used conservative allocation
    }    

    IERC20 public immutable cCOP;
    IERC20 public cUSD;
    IERC20 public cREAL;

    address public swapRouter;      // address of Mento swap Router
    address public oracle;          // FX oracle source

    uint256 public constant DURATION_30 = 30 days;
    uint256 public constant DURATION_60 = 60 days;
    uint256 public constant DURATION_90 = 90 days;

    mapping(address => PiggyDeposit[]) public userDeposits;

    event Deposited(address indexed user, uint256 amount, uint256 duration, bool safeMode);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);

    constructor(address _cCOP, address _cUSD, address _cREAL) Ownable (msg.sender){
        require(_cCOP != address(0), "Invalid cCOP address");
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_cREAL != address(0), "Invalud cReal address");

        cCOP = IERC20(_cCOP);
        cUSD = IERC20(_cUSD);
        cREAL = IERC20(_cREAL);
    }

}
