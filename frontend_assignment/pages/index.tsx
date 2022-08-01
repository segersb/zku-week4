import detectEthereumProvider from "@metamask/detect-provider"
import {Strategy, ZkIdentity} from "@zk-kit/identity"
import {generateMerkleProof, Semaphore} from "@zk-kit/protocols"
import {Contract, providers, utils} from "ethers"
import Head from "next/head"
import React, {useEffect} from "react"
import styles from "../styles/Home.module.css"
import Greeter from "../artifacts/contracts/Greeters.sol/Greeters.json";
import GreetingForm from '../components/GreetingForm'
import GreetingList from '../components/GreetingList'
import GreetingNotification from '../components/GreetingNotification'
import Message from '../components/Message'
import {Box, Button} from "@mui/material";

const wsProvider = new providers.WebSocketProvider("ws://localhost:8545");
const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Greeter.abi, wsProvider)
const newGreetingFilter = contract.filters.NewGreeting()

export default function Home() {
    const [greetingLog, setGreetingLog] = React.useState("")
    const [connected, setConnected] = React.useState(false)
    const [greetings, setGreetings] = React.useState([] as any)
    const [greetingNotification, setGreetingNotification] = React.useState(null as any)

    async function checkConnected() {
        const provider = (await detectEthereumProvider()) as any
        const ethersProvider = new providers.Web3Provider(provider)
        const signer = await ethersProvider.getSigner();

        try {
            await signer.getAddress()
            setConnected(true)
        } catch (e) {
        }
    }

    async function onConnect() {
        const provider = (await detectEthereumProvider()) as any
        await provider.request({method: "eth_requestAccounts"})
        setConnected(true)
    }

    // @ts-ignore
    async function onGreet(greetingForm) {
        const greeting = greetingForm.name + '\n' + greetingForm.age + '\n' + greetingForm.message
        try {
            utils.formatBytes32String(greeting)
        } catch (e) {
            setGreetingLog("Your greeting is too long!")
            return
        }

        setGreetingLog("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({method: "eth_requestAccounts"})

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setGreetingLog("Creating your Semaphore proof...")

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const {proof, publicSignals} = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()
            setGreetingLog(errorMessage)
        } else {
            setGreetingLog("Your anonymous greeting is onchain :)")
        }
    }

    async function listenForGreetings() {
        utils.parseBytes32String('0x426f620a35300a53757021000000000000000000000000000000000000000000')
        contract.on("NewGreeting", eventData => {
            const greetingData = utils.parseBytes32String(eventData).split('\n');
            setGreetingNotification({
                name: greetingData[0]
            })
            loadGreetings()
        })
    }

    async function loadGreetings() {
        const events = await contract.queryFilter(newGreetingFilter)
        const greetingsUpdate = events.map(event => {
            const greetingData = utils.parseBytes32String(event.data).split('\n');
            return {
                id: event.transactionHash,
                name: greetingData[0],
                age: greetingData[1],
                message: greetingData[2]
            }
        })
        setGreetings(greetingsUpdate)
    }

    useEffect(() => {
        loadGreetings()
        listenForGreetings()
        checkConnected()
    }, [])

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore."/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>
                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <Box sx={{padding: 2}}>
                    <GreetingList greetings={greetings}/>
                </Box>

                {!connected &&
                  <>
                    <Box sx={{padding: 2}}>
                      <Message message="Connect your wallet to greet!"/>
                    </Box>
                    <Button variant="contained" onClick={onConnect}>Connect</Button>
                  </>
                }

                {connected &&
                  <>
                    <Box sx={{padding: 2}}>
                      <GreetingForm onGreet={onGreet}/>
                    </Box>
                    <Message message={greetingLog}/>
                  </>
                }
            </main>

            <GreetingNotification greetingNotification={greetingNotification} onClose={() => setGreetingNotification(null)}/>
        </div>
    )
}
