import {Controller, useForm} from "react-hook-form";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import {useEffect, useState} from "react";
import {utils} from "ethers"

export default function GreetingForm ({onGreet}) {
  const [submitErrorOccurred, setSubmitErrorOccurred] = useState(false)

  const {control, handleSubmit, formState: {errors}, getValues, trigger, watch, setValue} = useForm({
    defaultValues: {
      name: '',
      age: '',
      message: ''
    }
  });

  const onSubmitValid = () => {
    const values = getValues()
    const greeting = {
      name: values['name'],
      age: values['age'],
      message: values['message']
    };
    console.log(greeting)
    setValue('name', '')
    setValue('age', '')
    setValue('message', '')
    onGreet(greeting)
  }

  const onSubmitError = () => {
    setSubmitErrorOccurred(true)
  }

  useEffect(() => {
    if (submitErrorOccurred) {
      trigger('message')
    }
  }, [watch('name'), watch('age')]);

  return (
    <form onSubmit={handleSubmit(onSubmitValid, onSubmitError)}>
      <Stack spacing={2} sx={{minWidth: 350}}>
        <Controller
          name="name"
          control={control}
          rules={{
            required: {value: true, message: 'name is required'}
          }}
          render={({field}) => <TextField
            {...field}
            autoComplete="off"
            label="Name"
            color="secondary"
            error={!!errors.name}
            helperText={errors.name && errors.name.message}
          />}
        />
        <Controller
          name="age"
          control={control}
          rules={{
            required: {value: true, message: 'age is required'},
            validate: {
              equals: value => Number.isInteger(Number(value)) || 'not a number',
            }
          }}
          render={({field}) => <TextField
            {...field}
            autoComplete="off"
            label="Age"
            color="secondary"
            error={!!errors.age}
            helperText={errors.age && errors.age.message}
          />}
        />
        <Controller
          name="message"
          control={control}
          rules={{
            required: {value: true, message: 'message is required'},
            validate: {
              equals: value => {
                const greeting = getValues()['name'] + '\n' + getValues()['age'] + '\n' + value;
                try {
                  utils.formatBytes32String(greeting)
                } catch (e) {
                  return 'greeting too long, use a shorter message or name'
                }
              },
            }
          }}
          render={({field}) => <TextField
            {...field}
            autoComplete="off"
            label="Message"
            color="secondary"
            error={!!errors.message}
            helperText={errors.message && errors.message.message}
          />}
        />
        <Button type="submit" variant="contained" color="secondary">Send greeting!</Button>
      </Stack>
    </form>
  )
}


