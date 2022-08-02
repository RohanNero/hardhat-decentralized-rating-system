const { developmentChains } = require("../../helper-hardhat-config")
const { getNamedAccounts, network, ethers } = require("hardhat")
const { assert } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("RatingSystem", function () {
      let ratingSystem
      let deployer
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        ratingSystem = await ethers.getContract("RatingSystem", deployer)
      })
      it("should let users ask questions and provide answers", async function () {
        const question = await ratingSystem.askQuestion(
          "t_title",
          "t_body",
          "t_tags"
        )
        await question.wait(1)
        const answer = await ratingSystem.postAnswer(0, "answer!")
        await answer.wait(1)
        const txResponse = await ratingSystem.questionMapping(0)
        const txResponse2 = await ratingSystem.answerMapping(0, 0)
        const qExpectedResponse = [0, "t_title", "t_body", "t_tags", 0, 0]
        const aExpectedResponse = [0, 0, "answer!", 0, 0]
        //console.log(`Question Mapping: ${txResponse}`)
        //console.log(`Answer Mapping: ${txResponse2}`)
        assert.equal(txResponse.toString(), qExpectedResponse.toString())
        assert.equal(txResponse2.toString(), aExpectedResponse.toString())
      })
    })
