require("dotenv").config();
const { IgApiClient } = require("instagram-private-api");

const username = process.env.username;
const password = process.env.password;
const ig = new IgApiClient();
const hashtag = "yourhashtag";

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

const main = async () => {
  try {
    //Login to Instagram
    console.log("\n\nLogging in...");
    ig.state.generateDevice(username);
    await ig.account.login(username, password);

    console.log("Simulating pre-login flow...");
    await ig.simulate.preLoginFlow();

    // Search for the latest posts with the hashtag provided
    console.log(`Getting posts with tag ${hashtag}...`);
    const hashtagFeed = await ig.feed.tag(hashtag, {
      rankToken: ig.state.cookieUserId,
      ranked_content: true,
    });

    // Iterate over the posts in the hashtag feed
    const posts = await hashtagFeed.items();
    let followed = 0

    for (const post of posts) {
      console.log("Getting user info...");
      const user = post.user;
      console.log("UserID: " + user.pk);

      // Check if the user who posted the post is already followed
      const friendshipStatus = await ig.friendship.show(user.pk);
      console.log(`Following ${user.username} = ${friendshipStatus.following}`);
      
      // Follow the user if not already following
      if (!friendshipStatus.following) {
        const updatedFrendshipStatus = await ig.friendship.create(user.pk);
        if (updatedFrendshipStatus.following) {
          console.log(`Followed ${user.username}!`);
        } else {
          // During mass following, Instagram will sometimes block the request, so just move on
          console.log(`Failed to follow ${user.username}! Moving on...`);
        }
      } else {
        console.log(`Already following ${user.username}!`);
      }

      // Adding a sleep to simulate human-like behavior
      await sleep(10000);
      followed++;
      
      // Only follow 5 users at a time to avoid hitting the Instagram API rate limit
      if (followed == 5) {
        console.log(`Followed ${followed} users!`);
        process.exit(0);
      }
    }

    // Log out of the Instagram API client
    await ig.account.logout();

  } catch (error) {
    // Log any errors that occur
    console.log(error);
  }
};

main();
