const { assert, expect } = require("chai")
// const chai = require("chai")
require("ethereum-waffle")
const { deployments, network, ethers } = require("hardhat")
const hre = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { beforeEach } = require("mocha")
const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers")

// deployer = (await getNamedAccounts()).deployer;
// await deployments.fixture(["all"]);

describe("RatingSystem", function () {
  let contract
  let owner
  let otherAccount
  let otherAccount2
  beforeEach(async function () {
    ;[owner, otherAccount, otherAccount2] = await ethers.getSigners()
    const RatingFactory = await ethers.getContractFactory("RatingSystem")
    contract = await RatingFactory.deploy()
  })
  it("should set owner address in constructor", async function () {
    const ownerAddr = await contract.owner()
    assert.equal(ownerAddr, 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266)
  })
  describe("askQuestion", function () {
    let txResponse
    beforeEach(async function () {
      txResponse = await contract.askQuestion("t_title", "t_body", "t_tags")
    })
    // Needs to be updated to not include questionMapping since it takes questionId as input
    // it("should correctly set the questionId when you ask a question", async function () {
    //   await contract.askQuestion("title2", "body2", "tags2")
    //   const question = await contract.questionMapping(1)
    //   assert.equal(question.questionId.toString(), "1")
    // })
    it("should create a question struct with the given input", async function () {
      const struct = await contract.questionMapping(0)
      assert.equal(struct.title, "t_title")
      assert.equal(struct.body, "t_body")
      assert.equal(struct.tags, "t_tags")
    })
    it("should add the question to the questionMapping and the addrToQuestionArray", async function () {
      const mappedQuestion = await contract.questionMapping(0)
      const addrToQuestion = await contract.addrToQuestionArray(
        owner.address,
        0
      )
      assert.equal(mappedQuestion.toString(), addrToQuestion.toString())
    })
    it("should correctly set the address that asked the question", async function () {
      await contract.askQuestion("test title", "bodied!", "taggz")
      const expectedValue = await contract.questionIdToAddress(0)
      assert.equal(owner.address, expectedValue)
    })
    it("should correctly emit the questionEvent with args", async function () {
      await expect(contract.askQuestion("t_title", "t_body", "t_tags"))
        .to.emit(contract, "questionEvent")
        .withArgs("1", "t_title")
    })
    it("should increment the questionIdCounter by 1", async function () {
      const initialCount = await contract.questionIdCounter()
      await contract.askQuestion("test title", "body", "tags")
      const finalCount = await contract.questionIdCounter()
      assert.equal(initialCount.add(1).toString(), finalCount.toString())
    })
  })

  describe("postAnswer", function () {
    let txResponse
    beforeEach(async function () {
      await contract.askQuestion("title", "body", "tags")
      txResponse = await contract.postAnswer(0, "answer data")
    })
    // Needs to be updated for same reasons as the first "askQuestion" function.
    // it("should correctly set the answerId when you post an answer", async function () {
    //   const answer = await contract.answerMapping(0, 0)
    //   console.log(answer.answerId)
    // })
    it("should correctly create an Answer struct with the given input", async function () {
      const item = await contract.answerMapping(0, 0)
      expect(item.answerId).to.equal(0)
      assert.equal(item.questionId, 0)
      assert.equal(item.answerId, 0)
      assert.equal(item.data, "answer data")
      assert.equal(item.likeCount, 0)
      assert.equal(item.dislikeCount, 0)
    })
    it("should add the answer to the user's addrToAnswerArray", async function () {
      const mapResponse = await contract.answerMapping(0, 0)
      const response = await contract.addrToAnswerArray(owner.address, 0)
      assert.equal(response.toString(), mapResponse.toString())
    })
    it("should return the correct address at answerIdToAddress mapping", async function () {
      const response = await contract.answerIdToAddress(0, 0)
      assert.equal(response, owner.address)
    })
    it("should correctly emit postAnswer event", async function () {
      await expect(contract.postAnswer(0, "solution!"))
        .to.emit(contract, "answerEvent")
        .withArgs(1, "solution!")
    })
    it("should increment the answerIdCounter after an Answer is created", async function () {
      const initialCount = await contract.answerIdCounter(0)
      await contract.postAnswer(0, "solution!")
      const newCount = await contract.answerIdCounter(0)
      assert.equal(initialCount.add(1).toString(), newCount.toString())
    })
  })
  describe("rateQuestion", function () {
    beforeEach(async () => {
      await contract
        .connect(otherAccount)
        .askQuestion("t_title", "t_body", "t_tags")
    })
    it("should revert if you try to rate your own item", async function () {
      const userRating = contract.connect(otherAccount).rateQuestion(0, true)
      await expect(userRating).to.be.revertedWith(
        "You cannot rate your own question!"
      )
    })
    // Need to change this in the smart contract to reflect stackoverflow's
    // logic, But I am unsure what happens when you change an item
    // from like to dislike on stack overflow
    it("should revert if user has already rated", async function () {
      const firstRating = await contract.rateQuestion(0, true)
      await expect(contract.rateQuestion(0, true)).to.be.revertedWith(
        "Cannot rate twice!"
      )
    })
    it("should revert if user doesn't have atleast 7 reputation", async function () {
      const response = contract.connect(otherAccount2).rateQuestion(0, true)
      await expect(response).to.be.revertedWith(
        "You need atleast 7 reputation!"
      )
    })
    it("should increment the like count when rated with 'true' ", async function () {
      const question = await contract.questionMapping(0)
      const previousLikes = question.likeCount
      await contract.rateQuestion(0, true)
      const updatedQuestion = await contract.questionMapping(0)
      const newLikes = updatedQuestion.likeCount.toString()
      assert.equal(previousLikes.add(1).toString(), newLikes)
    })
    it("should give the creator of the question +7 reputation when a user likes it", async function () {
      const itemCreator = otherAccount.address
      const prevRep = await contract.reputation(itemCreator)
      await contract.rateQuestion(0, true)
      const newRep = await contract.reputation(itemCreator)
      assert.equal(prevRep.add(7).toString(), newRep.toString())
    })
    it("should require atleast 21 reputation to dislike a question", async function () {
      await expect(
        contract.connect(otherAccount2).rateQuestion(0, false)
      ).to.be.revertedWith("You need atleast 21 reputation!")
    })
    it("should increment the dislike count once rated with 'false'", async function () {
      const question = await contract.questionMapping(0)
      const prevCount = question.dislikeCount
      await contract.rateQuestion(0, false)
      const updatedQuestion = await contract.questionMapping(0)
      const newCount = updatedQuestion.dislikeCount
      assert.equal(prevCount.add(1).toString(), newCount)
    })
    it("should emit a rate event whenever someone calls the rateQuestion() function", async function () {
      await expect(contract.rateQuestion(0, true))
        .to.emit(contract, "rateQuestionEvent")
        .withArgs(0, owner.address, true)
    })
  })
  describe("rateAnswer", function () {
    beforeEach(async function () {
      await contract.askQuestion("t_title", "t_body", "t_tags")
      await contract.connect(otherAccount).postAnswer(0, "answer data!")
    })
    it("should revert if the answerId input doesn't exist yet", async function () {
      await expect(contract.rateAnswer(0, 1, "true")).to.be.revertedWith(
        "answer not found!"
      )
    })
    it("should revert if user tries to rate their own answer", async function () {
      await expect(
        contract.connect(otherAccount).rateAnswer(0, 0, "true")
      ).to.be.revertedWith("You cannot rate your own answer!")
    })
    it("should revert if user has already rated the answer", async function () {
      await contract.rateAnswer(0, 0, "true")
      await expect(contract.rateAnswer(0, 0, "true")).to.be.revertedWith(
        "Cannot rate twice!"
      )
    })
    it("should revert if user doesn't have atleast 7 reputation", async function () {
      await expect(
        contract.connect(otherAccount2).rateAnswer(0, 0, "true")
      ).to.be.revertedWith("You need atleast 7 reputation!")
    })
    it("should increment the like count when rated with 'true' ", async function () {
      const initialAnswer = await contract.answerMapping(0, 0)
      const prevCount = initialAnswer.likeCount
      await contract.rateAnswer(0, 0, "true")
      const answer = await contract.answerMapping(0, 0)
      const newCount = answer.likeCount
      assert.equal(prevCount.add(1).toString(), newCount.toString())
    })
    it("should give the creator of the question +7 reputation when a user likes it", async function () {
      const prevRep = await contract.reputation(otherAccount.address)
      await contract.rateAnswer(0, 0, "true")
      const newRep = await contract.reputation(otherAccount.address)
      assert.equal(prevRep.add(7).toString(), newRep.toString())
    })
    it("should revert if user doesn't have atleast 21 reputation", async function () {
      await expect(
        contract.connect(otherAccount2).rateAnswer(0, 0, false)
      ).to.be.revertedWith("You need atleast 21 reputation!")
    })
    it("should increment the dislike count when rated with 'false' ", async function () {
      const answer = await contract.answerMapping(0, 0)
      const prevCount = answer.dislikeCount
      await contract.rateAnswer(0, 0, false)
      const updatedAnswer = await contract.answerMapping(0, 0)
      const newCount = updatedAnswer.dislikeCount
      assert.equal(prevCount.add(1).toString(), newCount.toString())
    })
    it("should correctly emit the rateAnswerEvent", async function () {
      await expect(contract.rateAnswer(0, 0, true))
        .to.emit(contract, "rateAnswerEvent")
        .withArgs(0, owner.address, true)
    })
  })

  describe("getQuestionRatingCount", function () {
    beforeEach(async function () {
      await contract
        .connect(otherAccount)
        .askQuestion("t_title", "t_body", "t_tags")
    })
    it("should return the correct rating count", async function () {
      const prevRatingCount = await contract.getQuestionRatingCount(0)
      const prevLCount = prevRatingCount.lCount
      const prevDCount = prevRatingCount.dCount
      await contract.rateQuestion(0, true)
      const getNewRatingCount = await contract.getQuestionRatingCount(0)
      const newLCount = getNewRatingCount.lCount
      const newDCount = getNewRatingCount.dCount
      assert.equal((prevLCount.add(1)).toString(), newLCount)
      assert.equal(
        prevLCount.add(prevDCount).add(1).toString(),
        newLCount.add(newDCount)
      )
    })
  })
  describe("getAnswerRatingCount", function () {
    beforeEach(async function () {
      await contract
        .connect(otherAccount)
        .askQuestion("t_title", "t_body", "t_tags")
      await contract.connect(otherAccount2).postAnswer(0,"t_answer")
    })
    it("should return the correct rating count", async function () {
      const prevRatingCount = await contract.getAnswerRatingCount(0,0)
      const prevLCount = prevRatingCount.lCount
      const prevDCount = prevRatingCount.dCount
      await contract.rateAnswer(0,0, true)
      const getNewRatingCount = await contract.getAnswerRatingCount(0,0)
      const newLCount = getNewRatingCount.lCount
      const newDCount = getNewRatingCount.dCount
      assert.equal(prevLCount.add(1).toString(), newLCount)
      assert.equal(
        prevLCount.add(prevDCount).add(1).toString(),
        newLCount.add(newDCount)
      )
    })
  })
  //   describe("getUserRating", function () {
  //     this.beforeEach(async function () {
  //       const [owner, otherAccount] = await ethers.getSigners()
  //       await contract
  //         .connect(otherAccount)
  //         .registerItem("spare tire", "wiki.org")
  //     })
  //     it("should return the user's rating on an item", async function () {
  //       await contract.rate(0, false)
  //       const rating = await contract.getUserRating(0)
  //       const userHasRated = rating.hasRated
  //       const userRating = rating.rating
  //       assert.equal(userHasRated, true)
  //       assert.equal(userRating, false)
  //     })
  //  })
})
