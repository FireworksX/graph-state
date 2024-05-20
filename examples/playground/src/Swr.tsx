import useSWR, { SWRConfig, useSWRConfig } from 'swr';
// import { useEffect } from 'react';
import type { Graph } from '@graph-state/core';
import { createState } from '@graph-state/core';
import swrPlugin, { isGraph } from '@graph-state/plugin-swr';
import loggerPlugin from '@graph-state/plugin-logger';
import { useCallback, useEffect, useRef } from 'react';
import { GraphValue, useGraph } from '@graph-state/react';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const Posts = () => {
  const { data, isLoading, mutate, graphState, graphStateMutate } = useSWR(
    'https://jsonplaceholder.typicode.com/users',
    fetcher,
    { revalidateOnFocus: false }
  );

  // const { _mutate, cache } = useSWRConfig();

  // useEffect(() => {
  //   mutate(data);
  // }, [data, mutate]);

  // const posts = cache.get(
  //   'https://jsonplaceholder.typicode.com/posts?userId=1'
  // );
  // `${post?._type}:${post?._id}`,
  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {data?.map(post => (
        <span
          style={{ padding: 10, border: '1px solid', marginBottom: 5 }}
          key={post?.id}
        >
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => {
                graphState.mutate(
                  `Request:https://jsonplaceholder.typicode.com/users`,
                  prev => {
                    console.log(prev);
                    return {
                      ...prev,
                      data: prev.data.filter(v => v === 'User:1'),
                    };
                  }
                );
              }}
            >
              SWR Mutate
            </button>
            <button
              onClick={() => {
                graphState.mutate(`${post?._type}:${post?._id}`, {
                  name: 'GraphState',
                });
              }}
            >
              GraphState Mutate
            </button>
            <span style={{ marginRight: 5 }}>{post?.id}:</span>
            <span>{post?.name}</span>
          </div>
          <GraphValue
            graphState={graphState}
            field={`${post?._type}:${post?._id}`}
          >
            {value => {
              return <h1>{value?.name}</h1>;
            }}
          </GraphValue>
          <p style={{ background: 'palegreen' }}>{post?.email}</p>
        </span>
      ))}
    </div>
  );
};

const graphState = createState({
  // @ts-ignore
  plugins: [
    loggerPlugin(),
    swrPlugin({
      transforms: {
        'https://jsonplaceholder.typicode.com/users'(_cache, payload) {
          if (payload?.data && !payload?.error) {
            const data = {
              ...payload,
              data: payload?.data?.map(e => {
                if (_cache.keyOfEntity(e)) {
                  return e;
                }

                return {
                  ...e,
                  _type: 'User',
                  _id: e.id,
                };
              }),
            };
            return data;
          }
          return payload;
        },
      },
    }),
  ],
});

window.graphState = graphState;

export const Swr = () => {
  function myMiddleware(useSWRNext, graphState) {
    {
      return (key, fetcher, config) => {
        const graphKey = `Request:${key}`;

        const swr = useSWRNext(key, fetcher, config);

        const [value, setValue] = useGraph(graphState, graphKey);

        // const setterHandler = useCallback(
        //   (...args) => {
        //     setValue(prev => {
        //       return { ...prev, data: args[0] };
        //     });
        //   },
        //   [graphKey, setValue]
        // );

        // useGraph(graphState, graphState);

        const resultData =
          swr?.data?.map(key => graphState.resolve(key)) || swr?.data;

        return Object.assign({}, swr, {
          data: resultData,
          graphState,
          graphStateMutate: graphState.mutate,
          // mutate: setterHandler,
        });
      };
    }
  }

  return (
    <SWRConfig
      value={{
        provider: () => graphState,
        use: [useSWRNext => myMiddleware(useSWRNext, graphState)],
      }}
    >
      <Posts />
    </SWRConfig>
  );
};
