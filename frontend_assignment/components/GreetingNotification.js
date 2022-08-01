import {Alert, Snackbar} from "@mui/material";

export default function GreetingNotification ({greetingNotification, onClose}) {
  return (
    <Snackbar open={!!greetingNotification} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
        {greetingNotification && `New greeting from ${greetingNotification.name}`}
      </Alert>
    </Snackbar>
  )
}

