import {useTheme} from "@mui/material";

export default function Message ({message}) {
  const theme = useTheme()

  return (
    <h2 style={{color: theme.palette.primary.main}}>
      {message}
    </h2>
  )
}


