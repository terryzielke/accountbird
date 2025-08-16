// server/utils/accountHelpers.js
const Account = require('../models/Account');
const Settings = require('../models/Settings');

/**
 * Fetches and populates the accountType field for a given account.
 * This function handles the complex task of populating a subdocument.
 * @param {object} account The Mongoose account document.
 * @returns {object} The account document with the populated accountType.
 */
const populateAccountType = async (account) => {
    if (!account) {
        return null;
    }

    try {
        const settings = await Settings.findOne();
        const subscriptionType = settings ? settings.subscriptionTypes.find(sub => String(sub._id) === String(account.accountType)) : null;

        const populatedAccount = {
            ...account._doc,
            accountType: subscriptionType ? { name: subscriptionType.name, _id: subscriptionType._id } : { name: 'Unknown', _id: 'Unknown' }
        };

        return populatedAccount;
    } catch (err) {
        console.error('Error populating account type:', err.message);
        return { ...account._doc, accountType: { name: 'Unknown', _id: 'Unknown' } };
    }
};

module.exports = {
    populateAccountType,
};