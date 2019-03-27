import React, { useState } from 'react';
import * as _ from 'lodash';
import styled from 'styled-components';
import { lv } from '@asuna-admin/logger';
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
  Radio,
  RadioGroup,
} from '@material-ui/core';

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
  updateLoggerLevel: (module, level) => void;
}

interface IDebugSettingsState {
  regex?: RegExp;
  filter?: string;
}

export function DebugSettings(props: IDebugSettingsProps) {
  const { modules, updateLoggerLevel } = props;
  const [state, setState] = useState<IDebugSettingsState>({});

  const resetLogger = () => {
    _.keys(modules).forEach(module => (modules[module] = 'warn'));
    setState({});
  };

  const setLoggerLevel = (module, level) => {
    updateLoggerLevel(module, level);
    setState({});
  };

  const onChange = _.debounce(value => setState({ regex: new RegExp(value), filter: value }), 300);

  return (
    <Container>
      <Button variant="contained" color="primary" onClick={resetLogger}>
        {'Reset Logger'}
      </Button>
      <Flex>
        <TextField
          label="filter"
          type="text"
          margin="normal"
          onChange={e => onChange(e.target.value)}
          defaultValue={state.filter}
        />
        {_.chain(modules)
          .toPairs()
          .filter(([module]) => (_.isRegExp(state.regex) ? state.regex.test(module) : true))
          .map(([module, level]) => (
            <FormControl key={module}>
              <FormLabel>{module}</FormLabel>
              <RadioGroup row value={level} onChange={(e, value) => setLoggerLevel(module, value)}>
                <FormControlLabel value="error" control={<Radio />} label="Error" />
                <FormControlLabel value="warn" control={<Radio />} label="Warn" />
                <FormControlLabel value="info" control={<Radio />} label="Info" />
                <FormControlLabel value="debug" control={<Radio />} label="Debug" />
                <FormControlLabel value="trace" control={<Radio />} label="Trace" />
              </RadioGroup>
            </FormControl>
          ))
          .value()}
      </Flex>
    </Container>
  );
}
