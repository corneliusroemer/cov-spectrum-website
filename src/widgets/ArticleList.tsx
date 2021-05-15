import React, { useEffect, useState } from 'react';
import { Widget } from './Widget';
import { AsyncZodQueryEncoder } from '../helpers/query-encoder';
import * as zod from 'zod';
import { Article } from '../services/api-types';
import { getArticles } from '../services/api';
import Loader from '../components/Loader';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { ExternalLink } from '../components/ExternalLink';
import { Pagination } from 'react-bootstrap';
import { createBootstrapPaginationControl } from '../helpers/bootstrap-pagination';

const ENTRIES_PER_PAGE = 10;

interface Props {
  pangolinLineage: string;
}

const InfoText = styled.div`
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const Entry = styled.div`
  margin-bottom: 10px;
`;

const EntryTitle = styled.div``;

const EntryMetadata = styled.div`
  display: flex;
  font-size: 0.9rem;
`;

const EntryMetadataValue = styled.div`
  margin-left: 10px;
  margin-right: 10px;
`;

function formatAuthorList(authors: string[]): string {
  if (authors.length === 0) {
    return '-';
  } else if (authors.length === 1) {
    return authors[0];
  } else {
    return authors[0] + ' et al.';
  }
}

export const ArticleList = ({ pangolinLineage }: Props) => {
  const [articles, setArticles] = useState<(Omit<Article, 'date'> & { date: Date })[] | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  useEffect(() => {
    let isSubscribed = true;
    const controller = new AbortController();
    const signal = controller.signal;
    getArticles({ pangolinLineage }, signal).then(articles => {
      if (isSubscribed) {
        const data = articles
          .map(a => ({
            ...a,
            date: new Date(a.date),
          }))
          .sort((a1, a2) => a2.date.getTime() - a1.date.getTime());
        setArticles(data);
      }
    });
    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [pangolinLineage]);

  if (!articles) {
    return <Loader />;
  }

  const paginationControl = createBootstrapPaginationControl(
    articles.length,
    ENTRIES_PER_PAGE,
    page,
    setPage
  );

  return (
    <>
      <InfoText>Found {articles.length} articles on medRxiv and bioRxiv</InfoText>
      <List>
        {articles.slice(ENTRIES_PER_PAGE * (page - 1), ENTRIES_PER_PAGE * page).map(article => (
          <Entry key={article.doi}>
            <EntryTitle>
              <ExternalLink url={'https://doi.org/' + (article.published || article.doi)}>
                {article.title}
              </ExternalLink>
            </EntryTitle>
            <EntryMetadata>
              <EntryMetadataValue>{formatAuthorList(article.authors)}</EntryMetadataValue>-{' '}
              <EntryMetadataValue>{dayjs(article.date).format('DD.MM.YYYY')}</EntryMetadataValue>-{' '}
              <EntryMetadataValue>{article.category}</EntryMetadataValue>
              {article.published ? (
                <>
                  - <EntryMetadataValue>published</EntryMetadataValue>
                </>
              ) : (
                <></>
              )}
            </EntryMetadata>
          </Entry>
        ))}
      </List>
      <Pagination size='sm'>{paginationControl.elements}</Pagination>
    </>
  );
};

export const ArticleListWidget = new Widget(
  new AsyncZodQueryEncoder(
    zod.object({
      pangolinLineage: zod.string(),
    }),
    async (decoded: Props) => decoded,
    async (encoded, signal) => encoded
  ),
  ArticleList,
  'ArticleList'
);