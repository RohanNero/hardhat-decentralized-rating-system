const { assert, expect } = require("chai")
// const chai = require("chai")
require("ethereum-waffle")
const { deployments, network, ethers } = require("hardhat")
const hre = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")

// deployer = (await getNamedAccounts()).deployer;
// await deployments.fixture(["all"]);

describe("RatingSystem", function () {
  let contract
  let owner
  let otherAccount
  beforeEach(async () => {
    const [owner] = await ethers.getSigners()
    const RatingFactory = await ethers.getContractFactory("RatingSystem")
    contract = await RatingFactory.deploy(owner.address)
    // deployer = accounts[0]
    // deployer = (await getNamedAccounts()).deployer;
    // await deployments.fixture(["all"]);
    //  RatingSystem = await ethers.getContract("RatingSystem", deployer);
    // const accounts = await ethers.getSigners();
  })
  it("should set owner address in constructor", async function () {
    const ownerAddr = await contract.i_owner()
    assert.equal(ownerAddr, 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266)
  })
  describe("registerAnswer", function () {
    it("should set the answerID when you create a new answer", async function () {
      const tdata = "Oil change"
      const udata = "google.com"
      const transResponse = await contract.registerAnswer(tdata, udata)
      expect(transResponse.value).to.equal(0)
    })
    it("should correctly create an Answer struct with the given input", async function () {
      const tdata = "Oil change"
      const udata = "google.com"
      await contract.registerAnswer(tdata, udata)
      const answer = await contract.answerMapping(0)
      expect(answer.answerID).to.equal(0)
      assert.equal(answer.tutorialData, tdata)
      assert.equal(answer.urlData, udata)
      assert.equal(answer.likeCount, 0)
      assert.equal(answer.dislikeCount, 0)
      assert.equal(answer.totalRatingCount, 0)
    })
    it("should add the answer to the answerMapping & the user's addrToAnswerArray", async function () {
      await contract.registerAnswer("oil change", "google.com")
      const answerResponse = await contract.answerMapping(0)
      const ownerAddr = await contract.i_owner()
      const response = await contract.addrToAnswerArray(ownerAddr, "0")
      assert.equal(response.toString(), answerResponse.toString())
    })
    it("the answerIdToAddress mapping should return the correct address", async function () {
      const ownerAddr = await contract.i_owner()
      await contract.registerAnswer("oil change", "google.com")
      const response = await contract.answerIdToAddress(0)
      assert.equal(response, ownerAddr)
    })
    it("should emit register answer event", async function () {
      await expect(contract.registerAnswer("oil change", "google.com"))
        .to.emit(contract, "registerEvent")
        .withArgs(0, "oil change", "google.com")
    })
    it("should increment the answerIdCounter after an answer is created", async function () {
      const originalCount = await contract.answerIdCounter()
      await contract.registerAnswer("oil change", "google.com")
      const newCount = await contract.answerIdCounter()
      assert.equal(originalCount.add(1).toString(), newCount.toString())
    })
  })
  describe("rate", function () {
    this.beforeEach(async () => {
      const [owner, otherAccount] = await ethers.getSigners()
      await contract
        .connect(otherAccount)
        .registerAnswer("engine swap", "youtube.com")
    })
    // Need to change this to reflect stackoverflow's logic, But I am unsure what
    // happens when you change answer from like to dislike on stack overflow
    it("should revert if user has already rated", async function () {
      const firstRating = await contract.rate(0, true)
      await expect(contract.rate(0, true)).to.be.revertedWith(
        "Cannot rate twice!"
      )
    })
    it("should revert if you try to rate your own answer", async function () {
      const [owner, otherAccount] = await ethers.getSigners()
      const userRating = contract.connect(otherAccount).rate(0, true)
      await expect(userRating).to.be.revertedWith(
        "You cannot rate your own answer!"
      )
    })
    it("should update the answer's total rating count", async function () {
      const getPreviousCount = await contract.answerMapping(0)
      const previousCount = getPreviousCount.totalRatingCount
      await contract.rate(0, true)
      const getNewCount = await contract.answerMapping(0)
      const newCount = getNewCount.totalRatingCount.toString()
      assert.equal(previousCount.add(1), newCount)
    })
    it("should require you to have atleast 7 reputation to like an answer", async function () {
      const [owner, otherAccount, newUser] = await ethers.getSigners()
      const response = contract.connect(newUser).rate(0, true)
      await expect(response).to.be.revertedWith(
        "You need atleast 7 reputation!"
      )
    })
    it("should increment the like count once rated with 'true' ", async function () {
      const getPreviousLikes = await contract.answerMapping(0)
      const previousLikes = getPreviousLikes.likeCount
      await contract.rate(0, true)
      const getNewLikes = await contract.answerMapping(0)
      const newLikes = getNewLikes.likeCount.toString()
      assert.equal(previousLikes.add(1).toString(), newLikes)
    })
    it("should give the creator of the answer +7 reputation when someone likes it", async function () {
      const [owner, otherAccount] = await ethers.getSigners()
      const answerCreator = otherAccount.address
      const prevRep = await contract.reputation(answerCreator)
      await contract.rate(0, true)
      const newRep = await contract.reputation(answerCreator)
      assert.equal(prevRep.add(7).toString(), newRep.toString())
    })
    it("should require atleast 21 reputation to dislike an answer", async function () {
      const [owner, otherAccount, newUser] = await ethers.getSigners()
      await expect(contract.connect(newUser).rate(0, false)).to.be.revertedWith(
        "You need atleast 21 reputation!"
      )
    })
    it("should increment the dislike count once rated with 'false'", async function () {
      const getPrevCount = await contract.answerMapping(0)
      const prevCount = getPrevCount.dislikeCount
      await contract.rate(0, false)
      const getNewCount = await contract.answerMapping(0)
      const newCount = getNewCount.dislikeCount
      assert.equal(prevCount.add(1).toString(), newCount)
    })
    it("should emit a rate event whenever someone calls the rate() function", async function () {
      const [ owner ] = await ethers.getSigners()
      await expect(contract.rate(0, true))
        .to.emit(contract, "rateEvent")
        .withArgs(0, owner.address, true)
    })
  })
  describe("getRatingCount", function () {
    this.beforeEach(async function () {
      const [owner, otherAccount] = await ethers.getSigners()
      await contract.connect(otherAccount).registerAnswer("jackstand", "scabble.net")
    })
    it("should return the correct rating count", async function () {
      const prevRatingCount = await contract.getRatingCount(0)
      const prevLCount = prevRatingCount.lCount 
      const prevDCount = prevRatingCount.dCount 
      await contract.rate(0, true) 
      const getNewRatingCount = await contract.getRatingCount(0)
      const newLCount = getNewRatingCount.lCount
      const newDCount = getNewRatingCount.dCount
      assert.equal((prevLCount.add(prevDCount)).add(1).toString(), newLCount.add(newDCount))
    })
  })
  describe("getUserRating", function () {
    this.beforeEach(async function () {
      const [owner, otherAccount] = await ethers.getSigners()
      await contract
        .connect(otherAccount)
        .registerAnswer("spare tire", "wiki.org")
    })
    it("should return the user's rating on an answer", async function () {
      await contract.rate(0, false)
      const rating = await contract.getUserRating(0)
      const userHasRated = rating.hasRated
      const userRating = rating.rating
      assert.equal(userHasRated, true)
      assert.equal(userRating, false)
    })
  })
})
