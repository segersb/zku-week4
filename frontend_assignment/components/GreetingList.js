import {Avatar, ListItem, ListItemAvatar, ListItemText, Paper, Stack} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';

export default function GreetingList ({greetings}) {
  if (greetings.length === 0) {
    return (<div>No greetings have been sent yet, be the first!</div>)
  }

  return (
    <Stack spacing={4} minWidth={350}>
      {greetings.map(greeting =>
        <Paper key={greeting.id}>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <SendIcon/>
              </Avatar>
            </ListItemAvatar>
            <ListItemText>{greeting.name} ({greeting.age}): {greeting.message}</ListItemText>
          </ListItem>
        </Paper>
      )}
    </Stack>
  )
}


