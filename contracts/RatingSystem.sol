// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;


contract RatingSystem {
    address public owner;

    // total number of questions 
    uint256 public questionIdCounter;

    // questionId to the number of answers that the question has
    mapping(uint256 => uint256) public answerIdCounter;
    
    struct Question {
        uint256 questionId;
        string title;
        string body;
        string tags;
        Answer[] answerList;
        uint256 likeCount;
        uint256 dislikeCount;
    }

    struct Answer {
        uint256 questionId;
        uint256 answerId;
        string data;
        uint256 likeCount;
        uint256 dislikeCount;
    }

    struct RatingByUser {
        bool hasRated;
        bool rating;
    }

    struct qComment {
        uint256 questionId;
        string comment;
    }

    struct aComment {
        uint256 answerId;
        string comment;
    }

    // mapping of each user's reputation
    mapping(address => uint256) public reputation;

    // storage for questions and answers by answerID
    mapping(uint256 => Question) public questionMapping;

    // questionId => answerId => Answer
    mapping(uint256 => mapping(uint256 => Answer)) public answerMapping;

    // Mapping of questionId to owner of that question
    mapping(uint256 => address) public questionIdToAddress;

    // Mapping of questionId => answerId to owner of that answer
    mapping(uint256 => mapping(uint256 => address)) public answerIdToAddress;

    // Mappings of each user's questions and answers
    mapping(address => Question[]) public addrToQuestionArray;
    mapping(address => Answer[]) public addrToAnswerArray;

    // stores a bool for the rating and bool for whether or not the user
    // has voted.
    mapping(address => mapping(uint256 => RatingByUser)) public qUserRating;
    mapping(address => mapping(uint256 => mapping(uint256 => RatingByUser))) public aUserRating;
    

    event questionEvent(uint256 questionId, string title);
    event answerEvent(uint256 answerId, string data);
    event rateQuestionEvent(uint256 questionId, address rater, bool rating);
    event rateAnswerEvent(uint256 answerId, address rater, bool rating);

    constructor() {
        owner = msg.sender;
        reputation[owner] += 21;
    }

    function askQuestion(
        string memory _title,
        string memory _body,
        string memory _tags
    ) public returns (uint256) {
        Question storage question = questionMapping[questionIdCounter];
         question.questionId =  questionIdCounter;
         question.title = _title;
         question.body = _body;
         question.tags = _tags;
         question.likeCount = 0;
         question.dislikeCount = 0;
        questionMapping[questionIdCounter] = question;
        addrToQuestionArray[msg.sender].push(question);
        questionIdToAddress[questionIdCounter] = msg.sender;
        emit questionEvent(questionIdCounter, _title);
        questionIdCounter += 1;
        return question.questionId;

    }

    function postAnswer(
        uint256 _questionId,
        string memory _data
    ) public returns (uint256) {
        require(_questionId < questionIdCounter, "Question Not Found!");
        Answer memory answer = Answer(
            _questionId,
            answerIdCounter[_questionId],
            _data,
            0,
            0
        );
        answerMapping[_questionId][answerIdCounter[_questionId]] = answer;
        addrToAnswerArray[msg.sender].push(answer);
        answerIdToAddress[_questionId][answerIdCounter[_questionId]] = msg.sender;
        emit answerEvent(answerIdCounter[_questionId], _data);
        answerIdCounter[_questionId] += 1;
        return answer.answerId;
    }


    function rateQuestion(uint256 _questionId, bool _score) public {
        require(
            msg.sender != questionIdToAddress[_questionId],
            "You cannot rate your own question!"
        );
        require(
            qUserRating[msg.sender][_questionId].hasRated == false,
            "Cannot rate twice!"
        );
        qUserRating[msg.sender][_questionId].hasRated = true;
        qUserRating[msg.sender][_questionId].rating = _score;
        if (_score == true) {
            require(
                reputation[msg.sender] >= 7,
                "You need atleast 7 reputation!"
            );
            questionMapping[_questionId].likeCount += 1;
            reputation[questionIdToAddress[_questionId]] += 7;
        } else {
            require(
                reputation[msg.sender] >= 21,
                "You need atleast 21 reputation!"
            );
            questionMapping[_questionId].dislikeCount += 1;
        }
        emit rateQuestionEvent(_questionId, msg.sender, _score);
    }

    function rateAnswer(uint256 _questionId, uint256 _answerId, bool _score) public {
        require(answerIdCounter[_questionId] > _answerId, "answer not found!");
        require(
            msg.sender != answerIdToAddress[_questionId][_answerId],
            "You cannot rate your own answer!"
        );
        require(
            aUserRating[msg.sender][_questionId][_answerId].hasRated == false,
            "Cannot rate twice!"
        );
        aUserRating[msg.sender][_questionId][_answerId].hasRated = true;
        aUserRating[msg.sender][_questionId][_answerId].rating = _score;
        if (_score == true) {
            require(
                reputation[msg.sender] >= 7,
                "You need atleast 7 reputation!"
            );
            answerMapping[_questionId][_answerId].likeCount += 1;
            reputation[answerIdToAddress[_questionId][_answerId]] += 7;
        } else {
            require(
                reputation[msg.sender] >= 21,
                "You need atleast 21 reputation!"
            );
            answerMapping[_questionId][_answerId].dislikeCount += 1;
        }
        emit rateAnswerEvent(_answerId, msg.sender, _score);
    }

    function getQuestionRatingCount(uint256 _questionId) public view returns(uint256 dCount, uint256 lCount) {
        lCount = questionMapping[_questionId].likeCount;
        dCount = questionMapping[_questionId].dislikeCount;
    }

    function getAnswerRatingCount(uint256 _questionId, uint256 _answerId)
        public
        view
        returns (uint256 dCount, uint256 lCount)
    {
        lCount = answerMapping[_questionId][_answerId].likeCount;
        dCount = answerMapping[_questionId][_answerId].dislikeCount;
        return (dCount, lCount);
    }

    // function getUserQRating(uint256 _questionId)
    //     public
    //     view
    //     returns (RatingByUser memory _rating)
    // {
    //     _rating = userRating[msg.sender][_questionId];
    //     return _rating;
    // }

    // function getUserARating(uint256 _answerId)
    //     public
    //     view
    //     returns (RatingByUser memory _rating)
    // {
    //     _rating = userRating[msg.sender][_answerId];
    //     return _rating;
    // }

    // function setBounty(uint256 _questionId, uint256 _bounty, uint256 _deadline) public {
    //     require(reputation[msg.sender] >= _bounty, "Bounty Exceeds User Reputation!");
    //     require(_bounty > 49, "Not Enough Reputation!");
    // }
}
