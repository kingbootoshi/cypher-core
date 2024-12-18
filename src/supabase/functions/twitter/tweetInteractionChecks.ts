import { supabase } from '../../supabaseClient';
import { Logger } from '../../../utils/logger';

type TweetAction = 'reply' | 'quote' | 'retweet';

export async function hasAlreadyActioned(
  tweetId: string,
  action: TweetAction
): Promise<boolean> {
  try {
    const field = action === 'reply' ? 'in_reply_to_tweet_id' : 
                 action === 'quote' ? 'quoted_tweet_id' : 
                 'retweeted_tweet_id';

    const { data, error } = await supabase
      .from('twitter_tweets')
      .select('id')
      .eq(field, tweetId)
      .maybeSingle();

    if (error) {
      Logger.error('Error checking tweet action status:', error.message);
      return false;
    }

    const hasActioned = !!data;
    Logger.info(`Tweet ${tweetId} ${action} status: ${hasActioned ? 'already done' : 'not done yet'}`);
    return hasActioned;

  } catch (error) {
    Logger.error(`Error checking if tweet ${tweetId} was already ${action}ed:`, error);
    return false;
  }
}

export async function hasInteractedWithTweet(tweetId: string): Promise<boolean> {
  try {
    Logger.info(`Checking interactions for tweet ${tweetId}...`);
    
    const { data: interactions, error } = await supabase
      .from('twitter_tweets')
      .select('tweet_type, in_reply_to_tweet_id, quoted_tweet_id, retweeted_tweet_id')
      .or(
        `in_reply_to_tweet_id.eq.${tweetId},` +
        `quoted_tweet_id.eq.${tweetId},` +
        `retweeted_tweet_id.eq.${tweetId}`
      );

    if (error) {
      Logger.error('Error checking tweet interactions:', error);
      return false;
    }

    if (interactions && interactions.length > 0) {
      const interactionTypes = interactions.map(i => {
        if (i.in_reply_to_tweet_id === tweetId) return 'reply';
        if (i.quoted_tweet_id === tweetId) return 'quote';
        if (i.retweeted_tweet_id === tweetId) return 'retweet';
        return null;
      }).filter(Boolean);

      Logger.info(`Found previous interactions for tweet ${tweetId}:`, interactionTypes);
      return true;
    }

    Logger.info(`No previous interactions found for tweet ${tweetId}`);
    return false;

  } catch (error) {
    Logger.error(`Error checking tweet interactions for ${tweetId}:`, error);
    return false;
  }
}

export async function debugTweetInteractions(tweetId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('twitter_tweets')
      .select('*')
      .or(
        `in_reply_to_tweet_id.eq.${tweetId},` +
        `quoted_tweet_id.eq.${tweetId},` +
        `retweeted_tweet_id.eq.${tweetId}`
      );

    if (error) {
      Logger.error('Error in debug check:', error);
      return;
    }

    Logger.info(`Debug: Found ${data.length} interactions for tweet ${tweetId}:`);
    data.forEach(interaction => {
      if (interaction.in_reply_to_tweet_id === tweetId) {
        Logger.info(`- Reply (Tweet ID: ${interaction.tweet_id})`);
      }
      if (interaction.quoted_tweet_id === tweetId) {
        Logger.info(`- Quote (Tweet ID: ${interaction.tweet_id})`);
      }
      if (interaction.retweeted_tweet_id === tweetId) {
        Logger.info(`- Retweet (Tweet ID: ${interaction.tweet_id})`);
      }
    });
  } catch (error) {
    Logger.error('Debug error:', error);
  }
}