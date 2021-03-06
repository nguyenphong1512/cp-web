'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * This module provides wrappers for the operations on chaincode that this demo
 * needs to perform.
 *
 * Contributors:
 *   Dale Avery - Initial implementation
 *
 * Created by davery on 11/8/2016.
 *******************************************************************************/

// For logging
var TAG = 'chaincode_ops:';

function CPChaincode(chain, chaincodeID) {
    if(!(chain && chaincodeID))
        throw new Error('Cannot create chaincode helper without both a chain object and the chaincode ID!');
    this.chain = chain;
    this.chaincodeID = chaincodeID;
}

/**
 * Create an account on the commercial paper trading network.  The given enrollID will also be taken as the name for the
 * commercial paper trading account.
 * @param enrollID The enrollID for the user submitting the transaction.
 * @param cb A callback function of the form: function(error)
 */
CPChaincode.prototype.createCompany = function (enrollID, cb) {
    console.log(TAG, 'Creating a trading account for:', enrollID);

    // 'this' won't exist inside the getMember callback
    var _this = this;

    // Submit the invoke transaction as the given user
    this.chain.getMember(enrollID, function (getMemberError, usr) {
        if (getMemberError) {
            console.error(TAG, 'failed to get ' + enrollID + ' member: ' + getMemberError.message);
            if (cb) cb(getMemberError);
        } else {
            console.log(TAG, 'successfully got member: ' + enrollID);

            // Accounts will be named after the enrolled users
            var Request = {
                chaincodeID: _this.chaincodeID,
                fcn: 'createAccount',
                args: [enrollID]
            };
            var invokeTx = usr.invoke(Request);
            invokeTx.on('submitted', function (results) {
                // Invoke transaction submitted successfully
                console.log(TAG, 'successfully submitted chaincode invoke transaction:', results);
                if (cb) cb(null);
            });
            invokeTx.on('error', function (err) {
                // Invoke transaction submission failed
                console.error(TAG, 'failed to submit chaincode invoke transaction:', err.message);
                if (cb) cb(err);
            });
        }
    });
};

CPChaincode.prototype.createPaper = function(enrollID, paper, cb) {
    console.log(TAG, 'creating a new commercial paper');

    // Accounts will be named after the enrolled users
    var Request = {
        chaincodeID: this.chaincodeID,
        fcn: 'issueCommercialPaper',
        args: [JSON.stringify(paper)]
    };

    invoke(this.chain, enrollID, Request, function(err, result) {
        if(err) {
            console.error(TAG, 'failed to create paper:', err);
            return cb(err);
        }

        console.log(TAG, 'Created paper successfully:', result);
    });
};

CPChaincode.prototype.getPapers = function(enrollID, cb) {
    console.log(TAG, 'getting commercial papers');

    // Accounts will be named after the enrolled users
    var Request = {
        chaincodeID: this.chaincodeID,
        fcn: 'query',
        args: ['GetAllCPs', enrollID]
    };

    query(this.chain, enrollID, Request, function(err, papers) {

        if(err) {
            console.error(TAG, 'failed to getPapers:', err);
            return cb(err);
        }

        console.log(TAG, 'got papers');
        cb(null, papers.toString());
    });
};

module.exports.CPChaincode = CPChaincode;

function invoke(chain, enrollID, requestBody, cb) {

    // Submit the invoke transaction as the given user
    console.log(TAG, 'Invoke transaction as:', enrollID);
    chain.getMember(enrollID, function (getMemberError, usr) {
        if (getMemberError) {
            console.error(TAG, 'failed to get ' + enrollID + ' member:', getMemberError.message);
            if (cb) cb(getMemberError);
        } else {
            console.log(TAG, 'successfully got member:', enrollID);

            console.log(TAG, 'invoke body:', JSON.stringify(requestBody));
            var invokeTx = usr.invoke(requestBody);

            // Print the invoke results
            invokeTx.on('completed', function (results) {
                // Invoke transaction submitted successfully
                console.log(TAG, 'Successfully completed invoke. Results:', results);
                cb(null, results);
            });
            invokeTx.on('submitted', function (results) {
                // Invoke transaction submitted successfully
                console.log(TAG, 'invoke submitted');
                cb(null, results);
            });
            invokeTx.on('error', function (err) {
                // Invoke transaction submission failed
                console.log(TAG, 'invoke failed. Error:', err);
                cb(err);
            });
        }
    });
}

function query(chain, enrollID, requestBody, cb) {

    // Submit the invoke transaction as the given user
    console.log(TAG, 'querying chaincode as:', enrollID);
    chain.getMember(enrollID, function (getMemberError, usr) {
        if (getMemberError) {
            console.error(TAG, 'failed to get ' + enrollID + ' member:', getMemberError.message);
            if (cb) cb(getMemberError);
        } else {
            console.log(TAG, 'successfully got member:', enrollID);

            console.log(TAG, 'query body:', JSON.stringify(requestBody));
            var queryTx = usr.query(requestBody);

            queryTx.on('complete', function (results) {
                console.log(TAG, 'Successfully completed query. Results:', results);
                cb(null, results.result);
            });
            queryTx.on('error', function (err) {
                console.log(TAG, 'query failed. Error:', err);
                cb(err);
            });
        }
    });
}
