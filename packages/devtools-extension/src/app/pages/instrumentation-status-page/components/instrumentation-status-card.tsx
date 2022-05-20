import { useDispatch, useSelector } from '@app/store';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import React from 'react';
import { instrumentationStatusPageActions } from '@app/actions/instrumentation-status-page-actions';
import { statusSelector } from '@app/store/status';

export function InstrumentationStatusCard() {
  const dispatch = useDispatch();
  const status = useSelector(statusSelector);
  switch (status.instrumentationStatus) {
    case undefined:
      return (
        <Card>
          <CardContent>
            <Typography variant="body1">Awaiting instrumentation...</Typography>
          </CardContent>
        </Card>
      );
    case 'not-installed':
      return (
        <Card>
          <CardContent>
            <Typography variant="body1">
              Instrumentation is not installed. Reload the page to install the
              instrumentation.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              onClick={() =>
                dispatch(
                  instrumentationStatusPageActions.ReloadPageButtonClicked()
                )
              }
            >
              Reload page
            </Button>
          </CardActions>
        </Card>
      );
    case 'not-available':
      return (
        <Card>
          <CardContent>
            <Typography variant="body1">
              Instrumentation seems to be unavailable. Make sure that you set up
              the instrumentation properly or wait a bit longer.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              target="_blank"
              href="https://github.com/ksz-ksz/rxjs-insights/blob/master/docs/instrumentation/index.md"
            >
              See documentation
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  instrumentationStatusPageActions.WaitForInstrumentationButtonClicked()
                )
              }
            >
              Wait
            </Button>
          </CardActions>
        </Card>
      );
    default:
      return null;
  }
}
