import { ethers, waffle } from "hardhat"
import { expect } from "chai"
import { ecsign } from 'ethereumjs-util'
import { Contract } from 'ethers'
import { getApprovalDigest } from './shared/utilities'

const keccak256 = ethers.utils.keccak256
const toUtf8Bytes = ethers.utils.toUtf8Bytes
const TOTAL_SUPPLY = ethers.utils.parseEther('10000')
const TEST_AMOUNT = ethers.utils.parseEther('10')
const MaxUint256 = ethers.constants.MaxUint256
const hexlify = ethers.utils.hexlify
const bigNumberify = ethers.BigNumber.from

const provider = waffle.provider;
const { deployContract, solidity } = waffle;
const [wallet, other] = provider.getWallets()

describe('UniswapV2ERC20', () => {
	let TestToken;
	let token: Contract;
	

	beforeEach(async () => {
		TestToken =  await ethers.getContractFactory("TestUniswapV2ERC20");
		token = await TestToken.deploy(TOTAL_SUPPLY);
  	})

	it('network sanity check', async () =>{
		let network = await provider.getNetwork();
		expect(network.chainId).to.eq(1287);
	})

	it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {

		
		const name = await token.name();
		expect(name).to.eq('ENEDEX LP Token');
		expect(await token.symbol()).to.eq('DLP');
		expect(await token.decimals()).to.eq(18);
		expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
		expect(await token.DOMAIN_SEPARATOR()).to.eq(
			keccak256(
				ethers.utils.defaultAbiCoder.encode(
					['bytes32','bytes32','bytes32','uint256','address'],
					[
					  keccak256(
					    toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
					  ),
					  keccak256(toUtf8Bytes(name)),
					  keccak256(toUtf8Bytes('1')),
					  1287,
					  token.address
					]
				)
			)
		)
		

	})

	it('transfer', async () => {
    		await expect(token.transfer(other.address, TEST_AMOUNT))
      			.to.emit(token, 'Transfer')
      			.withArgs(wallet.address, other.address, TEST_AMOUNT)
    		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
	})

	it('transfer:fail', async () => {
    		await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be.reverted // ds-math-sub-underflow
    		await expect(token.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
  	})

	it('transferFrom', async () => {
    		await token.approve(other.address, TEST_AMOUNT)
    		await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      			.to.emit(token, 'Transfer')
      			.withArgs(wallet.address, other.address, TEST_AMOUNT)
    		expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  	})

	it('transferFrom:max', async () => {
    		await token.approve(other.address, MaxUint256)
    		await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      			.to.emit(token, 'Transfer')
      			.withArgs(wallet.address, other.address, TEST_AMOUNT)
    		expect(await token.allowance(wallet.address, other.address)).to.eq(MaxUint256)
    		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  	})

	it('permit', async () => {
    		const nonce = await token.nonces(wallet.address)
    		const deadline = MaxUint256
    		const digest = await getApprovalDigest(
      			token,
      			{ owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
      			nonce,
      			deadline
    			)

    		const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    		await expect(token.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, hexlify(r), hexlify(s)))
      			.to.emit(token, 'Approval')
      			.withArgs(wallet.address, other.address, TEST_AMOUNT)
    		expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    		expect(await token.nonces(wallet.address)).to.eq(bigNumberify(1))
  })

})
