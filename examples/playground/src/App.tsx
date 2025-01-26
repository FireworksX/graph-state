import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
  useGraphEffect,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import profilerPlugin from '@graph-state/plugin-profiler';
import { SpringValue, animated } from '@react-spring/web';
import { useState } from 'react';

const deepNested = {
  _type: 'Level40',
  _id: '1',
  nested: {
    _type: 'Level39',
    _id: '1-39',
    nested: {
      _type: 'Level38',
      _id: '1-38',
      nested: {
        _type: 'Level37',
        _id: '1-37',
        nested: {
          _type: 'Level36',
          _id: '1-36',
          nested: {
            _type: 'Level35',
            _id: '1-35',
            nested: {
              _type: 'Level34',
              _id: '1-34',
              nested: {
                _type: 'Level33',
                _id: '1-33',
                nested: {
                  _type: 'Level32',
                  _id: '1-32',
                  nested: {
                    _type: 'Level31',
                    _id: '1-31',
                    nested: {
                      _type: 'Level30',
                      _id: '1-30',
                      nested: {
                        _type: 'Level29',
                        _id: '1-29',
                        nested: {
                          _type: 'Level28',
                          _id: '1-28',
                          nested: {
                            _type: 'Level27',
                            _id: '1-27',
                            nested: {
                              _type: 'Level26',
                              _id: '1-26',
                              nested: {
                                _type: 'Level25',
                                _id: '1-25',
                                nested: {
                                  _type: 'Level24',
                                  _id: '1-24',
                                  nested: {
                                    _type: 'Level23',
                                    _id: '1-23',
                                    nested: {
                                      _type: 'Level22',
                                      _id: '1-22',
                                      nested: {
                                        _type: 'Level21',
                                        _id: '1-21',
                                        nested: {
                                          _type: 'Level20',
                                          _id: '1-20',
                                          nested: {
                                            _type: 'Level19',
                                            _id: '1-19',
                                            nested: {
                                              _type: 'Level18',
                                              _id: '1-18',
                                              nested: {
                                                _type: 'Level17',
                                                _id: '1-17',
                                                nested: {
                                                  _type: 'Level16',
                                                  _id: '1-16',
                                                  nested: {
                                                    _type: 'Level15',
                                                    _id: '1-15',
                                                    nested: {
                                                      _type: 'Level14',
                                                      _id: '1-14',
                                                      nested: {
                                                        _type: 'Level13',
                                                        _id: '1-13',
                                                        nested: {
                                                          _type: 'Level12',
                                                          _id: '1-12',
                                                          nested: {
                                                            _type: 'Level11',
                                                            _id: '1-11',
                                                            nested: {
                                                              _type: 'Level10',
                                                              _id: '1-10',
                                                              nested: {
                                                                _type: 'Level9',
                                                                _id: '1-9',
                                                                nested: {
                                                                  _type:
                                                                    'Level8',
                                                                  _id: '1-8',
                                                                  nested: {
                                                                    _type:
                                                                      'Level7',
                                                                    _id: '1-7',
                                                                    nested: {
                                                                      _type:
                                                                        'Level6',
                                                                      _id: '1-6',
                                                                      nested: {
                                                                        _type:
                                                                          'Level5',
                                                                        _id: '1-5',
                                                                        nested:
                                                                          {
                                                                            _type:
                                                                              'Level4',
                                                                            _id: '1-4',
                                                                            nested:
                                                                              {
                                                                                _type:
                                                                                  'Level3',
                                                                                _id: '1-3',
                                                                                nested:
                                                                                  {
                                                                                    _type:
                                                                                      'Level2',
                                                                                    _id: '1-2',
                                                                                    nested:
                                                                                      {
                                                                                        _type:
                                                                                          'Level1',
                                                                                        _id: '1-1',
                                                                                        reference:
                                                                                          'Root:1',
                                                                                      },
                                                                                  },
                                                                              },
                                                                          },
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const generateId = () => Math.random().toString(16).slice(2);

const graphState = createState({
  type: 'State',
  initialState: {
    user: {
      _type: 'User',
      _id: '1',
      age: 10,
    },
  },
  plugins: [profilerPlugin(), loggerPlugin()],
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  // const [type] = useGraph(graphState, 'User:1', { deep: true });
  const [key, setKey] = useState('User:1');
  const allSkills = useGraphStack(graphState, ['Skill:js']);
  // useGraphEffect(graphState, key, (prevValue, nextValue) => {
  //   console.log(prevValue, nextValue);
  //   // if (nextValue) {
  //   //   graphState.mutate({
  //   //     _type: 'Layer',
  //   //     _id: 'header',
  //   //     user: 'Layer:header',
  //   //     field: '123',
  //   //   });
  //   // }
  // });

  return (
    <>
      <h1>Hello world</h1>
      {/*<GraphValue*/}
      {/*  graphState={graphState}*/}
      {/*  field={undefined}*/}
      {/*  options={{ safe: false }}*/}
      {/*>*/}
      {/*  {value => {*/}
      {/*    return <>{console.log(value)}</>;*/}
      {/*  }}*/}
      {/*</GraphValue>*/}
      {/*<pre>{JSON.stringify(type)}</pre>*/}
      {/*<button onClick={() => setKey('User:2')}>Change key</button>*/}
      <button
        onClick={() => {
          graphState.mutate('User:0', { age: Math.random() });
        }}
      >
        Set age
      </button>
      <button
        onClick={() => {
          graphState.mutate(
            'User:0',
            prev => ({
              ...prev,
              skills: ['Skill:js', 'Skill:ts'],
            }),
            { replace: true }
          );
        }}
      >
        Remove skill
      </button>
      <button
        onClick={() => {
          graphState.mutate('User:0', {
            test: ['$$File:100'],
            field: '$$File:200',
          });
        }}
      >
        Change order
      </button>

      {/*<ul>*/}
      {/*  {allSkills?.map(skill => (*/}
      {/*    <li key={skill?._id}>{skill?._id ?? 'null'}</li>*/}
      {/*  ))}*/}
      {/*</ul>*/}

      <animated.div
        style={{
          width: 100,
          height: 100,
          background: 'red',
        }}
      />
      <button
        onClick={() => {
          const l = graphState.mutate(graphState.key, {
            rotate: Math.random() * 300,
          });

          console.log(l);
        }}
      >
        Rotate
      </button>
      {/*<br />*/}
      {/*<h2>Rename authors</h2>*/}
      {/*{users.map(userKey => (*/}
      {/*  <GraphValue key={userKey} graphState={graphState} field={userKey}>*/}
      {/*    {(user, updateUser) => (*/}
      {/*      <Author key={userKey} authorEntity={userKey}>*/}
      {/*        <input*/}
      {/*          type="text"*/}
      {/*          value={user.name}*/}
      {/*          onChange={({ target }) => updateUser({ name: target.value })}*/}
      {/*        />*/}
      {/*        <label htmlFor="">*/}
      {/*          Age*/}
      {/*          <input*/}
      {/*            type="text"*/}
      {/*            value={user.age}*/}
      {/*            onChange={({ target }) => updateUser({ age: target.value })}*/}
      {/*          />*/}
      {/*        </label>*/}
      {/*      </Author>*/}
      {/*    )}*/}
      {/*  </GraphValue>*/}
      {/*))}*/}

      {/*{posts.map(post => (*/}
      {/*  <Post key={post} postKey={post} />*/}
      {/*))}*/}
    </>
  );
}

export default App;
