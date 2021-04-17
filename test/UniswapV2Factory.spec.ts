import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'


import { getCreate2Address } from './shared/utilities'
import UniswapV2Pair from '../artifacts/contracts/uniswapv2/UniswapV2Pair.sol/UniswapV2Pair.json'

const AddressZero = ethers.constants.AddressZero
const bigNumberify = ethers.BigNumber.from
const provider = waffle.provider;
const { createFixtureLoader, solidity } = waffle;
const [wallet, other] = provider.getWallets()

const TEST_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000'
  ]


describe('UniswapV2Factory', () => {

	let factory: Contract

	beforeEach(async () => {
		const cFactory =  await ethers.getContractFactory("UniswapV2Factory");
		factory = await cFactory.deploy(wallet.address);
	})

	it('feeTo, feeToSetter, allPairsLength', async () => {
    		expect(await factory.feeTo()).to.eq(AddressZero)
    		expect(await factory.feeToSetter()).to.eq(wallet.address)
    		expect(await factory.allPairsLength()).to.eq(0)
  	})

	async function createPair(tokens: [string, string]) {
    		const bytecode = UniswapV2Pair.bytecode
    		const create2Address = getCreate2Address(factory.address, tokens, bytecode)
    		await expect(factory.createPair(...tokens))
      			.to.emit(factory, 'PairCreated')
      			.withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, bigNumberify(1))

    		await expect(factory.createPair(...tokens)).to.be.reverted // UniswapV2: PAIR_EXISTS
    		await expect(factory.createPair(...tokens.slice().reverse())).to.be.reverted // UniswapV2: PAIR_EXISTS
    		expect(await factory.getPair(...tokens)).to.eq(create2Address)
    		expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
    		expect(await factory.allPairs(0)).to.eq(create2Address)
    		expect(await factory.allPairsLength()).to.eq(1)

    		const pair = new Contract(create2Address, JSON.stringify(UniswapV2Pair.abi), provider)
    		expect(await pair.factory()).to.eq(factory.address)
    		expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
    		expect(await pair.token1()).to.eq(TEST_ADDRESSES[1])
  	}

	it('createPair', async () => {
    		await createPair(TEST_ADDRESSES)
  	})

	it('createPair:reverse', async () => {
    		await createPair(TEST_ADDRESSES.slice().reverse() as [string, string])
  	})

	it('createPair:gas', async () => {
    		const tx = await factory.createPair(...TEST_ADDRESSES)
    		const receipt = await tx.wait()
    		expect(receipt.gasUsed).to.eq(2068206)
  	})

	it('setFeeTo', async () => {
    		await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
    		await factory.setFeeTo(wallet.address)
    		expect(await factory.feeTo()).to.eq(wallet.address)
  	})

	it('setFeeToSetter', async () => {
    		await expect(factory.connect(other).setFeeToSetter(other.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
    		await factory.setFeeToSetter(other.address)
    		expect(await factory.feeToSetter()).to.eq(other.address)
    		await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
  	})




})
