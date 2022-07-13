// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// import "@openzeppelin/contracts/access/Ownable.sol";

contract RatingSystem {
    uint256 public answerIdCounter;
    address public immutable i_owner;

    struct Answer {
        uint256 answerID;
        string tutorialData;
        string urlData;
        uint256 likeCount;
        uint256 dislikeCount;
        uint256 totalRatingCount;
    }

    struct RatingByUser {
        bool hasRated;
        bool rating;
    }

    mapping(address => uint256) public reputation;
    // storage for answers by answerID
    mapping(uint256 => Answer) public answerMapping;

    // Mapping of answerID to owner of that content
    mapping(uint256 => address) public answerIdToAddress;

    // mapping(address => mapping(uint256 => answer)) public whoOwnsWhat;
    mapping(address => Answer[]) public addrToAnswerArray;

    // storage for scores for each answerID
    // mapping(uint256 => bool[]) answerScores;

    // stores a bool for the rating and bool for whether or not the user
    // has voted.
    mapping(address => mapping(uint256 => RatingByUser)) public userRating;

    event registerEvent(uint256 answerId, string tData, string Udata);

    event rateEvent(uint256 answerId, address rater, bool rating);

    constructor(address _owner) {
        i_owner = _owner;
        reputation[_owner] += 21;
    }

    function registerAnswer(string memory _tutorialData, string memory _urlData)
        public
        returns (uint256)
    {
        Answer memory answer = Answer(
            answerIdCounter,
            _tutorialData,
            _urlData,
            0,
            0,
            0
        );
        answerMapping[answerIdCounter] = answer;
        addrToAnswerArray[msg.sender].push(answer);
        answerIdToAddress[answerIdCounter] = msg.sender;
        emit registerEvent(answerIdCounter, _tutorialData, _urlData);
        answerIdCounter += 1;
        return answer.answerID;
    }

    function rate(uint256 _answerId, bool _score) public {
        require(
            userRating[msg.sender][_answerId].hasRated == false,
            "Cannot rate twice!"
        );
        require(
            msg.sender != answerIdToAddress[_answerId],
            "You cannot rate your own answer!"
        );
        userRating[msg.sender][_answerId].hasRated = true;
        userRating[msg.sender][_answerId].rating = _score;
        answerMapping[_answerId].totalRatingCount += 1;
        if (_score == true) {
            require(
                reputation[msg.sender] >= 7,
                "You need atleast 7 reputation!"
            );
            answerMapping[_answerId].likeCount += 1;
            reputation[answerIdToAddress[_answerId]] += 7;
        } else {
            require(
                reputation[msg.sender] >= 21,
                "You need atleast 21 reputation!"
            );
            answerMapping[_answerId].dislikeCount += 1;
        }
        emit rateEvent(_answerId, msg.sender, _score);
    }

    function getRatingCount(uint256 _answerId)
        public
        view
        returns (uint256 dCount, uint256 lCount)
    {
        lCount = answerMapping[_answerId].likeCount;
        dCount = answerMapping[_answerId].dislikeCount;
        return (dCount, lCount);
    }

    function getUserRating(uint256 _answerId)
        public
        view
        returns (RatingByUser memory _rating)
    {
        _rating = userRating[msg.sender][_answerId];
        return _rating;
    }

    // function adminGetUserRating(uint256 _answerId, address _user)
    //     public
    //     view
    //     returns (RatingByUser memory _rating)
    // {
    //     _rating = userRating[_user][_answerId];
    // }
}
