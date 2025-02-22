import { useContext, useMemo, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { request } from 'graphql-request';
import {
  AdvancedSettings,
  AllTagCategoriesData,
  FeedSettings,
  FEED_SETTINGS_QUERY,
  TagCategory,
  getEmptyFeedSettings,
} from '../graphql/feedSettings';
import AuthContext from '../contexts/AuthContext';
import { graphqlUrl } from '../lib/config';
import { generateQueryKey } from '../lib/query';
import { LoggedUser } from '../lib/user';
import usePersistentContext from './usePersistentContext';
import useDebounce from './useDebounce';

export const getFeedSettingsQueryKey = (user?: LoggedUser): string[] => [
  user?.id,
  'feedSettings',
];

export type FeedSettingsReturnType = {
  tagsCategories: TagCategory[];
  feedSettings: FeedSettings;
  isLoading: boolean;
  hasAnyFilter?: boolean;
  advancedSettings: AdvancedSettings[];
  setAvoidRefresh: (value: boolean) => void;
};

export const getHasAnyFilter = (feedSettings: FeedSettings): boolean =>
  feedSettings?.includeTags?.length > 0 ||
  feedSettings?.blockedTags?.length > 0 ||
  feedSettings?.excludeSources?.length > 0 ||
  feedSettings?.advancedSettings?.length > 0;

const isObjectEmpty = (obj: unknown) => {
  if (typeof obj === 'undefined' || obj === null) {
    return true;
  }

  return Object.keys(obj).length === 0;
};

const AVOID_REFRESH_KEY = 'avoidRefresh';

export default function useFeedSettings(): FeedSettingsReturnType {
  const { user } = useContext(AuthContext);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const filtersKey = getFeedSettingsQueryKey(user);
  const queryClient = useQueryClient();
  const [avoidRefresh, setAvoidRefresh] = usePersistentContext(
    AVOID_REFRESH_KEY,
    false,
    [true, false],
    false,
  );
  const [invaliateQueries] = useDebounce(() => {
    queryClient.invalidateQueries(generateQueryKey('popular', user));
    queryClient.invalidateQueries(generateQueryKey('my-feed', user));
  }, 100);

  const { data: feedQuery = {}, isLoading } = useQuery<AllTagCategoriesData>(
    filtersKey,
    async () => {
      const req = await request<AllTagCategoriesData>(
        graphqlUrl,
        FEED_SETTINGS_QUERY,
        { loggedIn: !!user?.id },
      );

      if (user) {
        return req;
      }

      const feedSettings = isObjectEmpty(feedQuery.feedSettings)
        ? getEmptyFeedSettings()
        : feedQuery.feedSettings;

      return { ...req, feedSettings };
    },
  );

  const { tagsCategories, feedSettings, advancedSettings } = feedQuery;

  useEffect(() => {
    if (!user?.id || avoidRefresh) {
      return;
    }

    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    invaliateQueries();
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsCategories, feedSettings, avoidRefresh]);

  return useMemo(() => {
    return {
      tagsCategories,
      feedSettings,
      isLoading,
      advancedSettings,
      hasAnyFilter: getHasAnyFilter(feedSettings),
      setAvoidRefresh,
    };
  }, [
    tagsCategories,
    feedSettings,
    isLoading,
    advancedSettings,
    setAvoidRefresh,
  ]);
}
