import React, { useState } from 'react';
import * as _ from 'lodash';
import styled from 'styled-components';
import { lv } from 'asuna-admin';
import { Button, FormControl, FormControlLabel, FormLabel, TextField } from '@material-ui/core';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

const Container = styled.div`
  margin: 1rem;
`;

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
`;

export interface IDebugSettingsProps {
  modules: { [key: string]: keyof typeof lv };
}

interface IDebugSettingsState {
  regex?: RegExp;
  filter?: string;
}

export function DebugSettings(props: IDebugSettingsProps) {
  const { modules } = props;
  const [state, setState] = useState<IDebugSettingsState>({});

  console.log('props is', props);
  const resetLogger = () => {
    _.keys(modules).forEach(module => (modules[module] = 'warn'));
    setState({});
  };

  const setLoggerLevel = (module, level) => {
    modules[module] = level;
    console.log({ module, state });
    setState({});
  };

  return (
    <Container>
      <Flex>
        <TextField
          label="filter"
          type="text"
          margin="normal"
          onChange={e => setState({ regex: new RegExp(e.target.value), filter: e.target.value })}
          defaultValue={state.filter}
        />
        {_.chain(modules)
          .toPairs()
          .filter(([module]) => (_.isRegExp(state.regex) ? state.regex.test(module) : true))
          .map(([module, level]) => {
            return (
              <div key={module}>
                <div>
                  <FormControl>
                    <FormLabel>{module}</FormLabel>
                    <RadioGroup
                      row
                      value={level}
                      onChange={(e, value) => setLoggerLevel(module, value)}
                    >
                      <FormControlLabel value="error" control={<Radio />} label="Error" />
                      <FormControlLabel value="warn" control={<Radio />} label="Warn" />
                      <FormControlLabel value="info" control={<Radio />} label="Info" />
                      <FormControlLabel value="debug" control={<Radio />} label="Debug" />
                      <FormControlLabel value="trace" control={<Radio />} label="Trace" />
                    </RadioGroup>
                  </FormControl>
                </div>
              </div>
            );
          })
          .value()}
      </Flex>

      <div>
        <Button variant="contained" color="primary" onClick={resetLogger}>
          {'Reset Logger'}
        </Button>
        {/*<Button>{'Cancel'}</Button>*/}
        {/*<Button onClick={resetLogger}>{'Reset'}</Button>*/}
      </div>
    </Container>
  );
}
