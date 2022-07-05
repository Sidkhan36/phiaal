import React, {useState, useEffect,useRef} from "react"
import Web3Modal from "web3modal";
import web3 from 'web3/dist/web3.min.js'
import { providers, Contract } from "ethers";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "./constants";
import convert from "ethereum-unit-converter";
import "./App.css"
import detectEthereumProvider from '@metamask/detect-provider';


const App = () => {
  const [currentPrice, setCurrentPrice] = useState("");
  const [convertedPrice, setConvertedPrice] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState();
  const [walletType, setWalletType] = useState();
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState();
  const web3ModalRef = useRef();
  const convert = require('ethereum-unit-converter')

  useEffect(() => {
    const Dtc = async () => {
      const provider = await detectEthereumProvider();
      setWalletType(provider)
    }
    Dtc()
  }, []);

  useEffect(() => {
    console.log(walletType)
  }, [walletType]);

  useEffect(() => {
    checkPaused()
    if (currentPrice === undefined){
      revealPrice()
    }
  }, []);
  useEffect(() => {
    if(paused !== undefined){
      console.log(paused)
    }
  }, [paused]);


  useEffect(() => {
    console.log(currentPrice)
  }, [currentPrice]);

  /**
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Mainnet");
      throw new Error("Change network to Mainnet");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      const tx = await whitelistContract.addAddressToWhitelist(
          {
            value: web3.utils.toWei(currentPrice, "wei"),
            gasLimit:web3.utils.toWei("0.0000000000001")
          }
      );
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };

  const revealPrice = async () => {
    try {
      const provider = await getProviderOrSigner();

      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );

      const getprice = await whitelistContract._price()
      const parsedGetPrice = parseInt( getprice._hex, 16)
      setCurrentPrice(parsedGetPrice.toString())
      const result = convert(parsedGetPrice, 'wei')
      setConvertedPrice(result.ether)
    }
    catch (err) {
      console.log(err)
    }
  }
  const checkPaused = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );
      const pausedStatus = await whitelistContract.paused()
      setPaused(pausedStatus)
      console.log(pausedStatus)
    }
    catch (e){
      console.log(e)
    }
  }
  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
          address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
      revealPrice()
      checkPaused()

    } catch (err) {
      console.error(err);
    }
  };


  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
              <a href="#">Ready for PRE-MINT?</a>
        );
      } else if (loading) {
        return <button className="mt-8 w-full bg-gradient-to-br from-[#B98BC6] to-[#fa82c8] shadow-lg hover:shadow-[#faedf0] hover:transition hover:ease-out hover:delay-75 font-bold  font-bold px-6 py-3 rounded-3xl text-[18px] text-white hover:shadow-[#fada91]  tracking-wide uppercase" disabled >Loading...</button>;
      } else {
        return <a href="#" onClick={addAddressToWhitelist}>Join Whitelist</a>
      }
    } else {
      return (
          ""
      );
    }
  };
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
      <>
        <main>
          <section className="home-menu">
            <header className="header-main">
              <div className="nav-area-full">
                <div className="container-fluid">
                  <div className="row" id="home-row">
                    <div className="col-md-1 logo-area">
                      <div className="logo" id="wallet-logo"><a href="index.html"><h6>Phial<span>of Life</span></h6></a>
                      </div>
                    </div>
                    <div className="col-md-8 d-flex"></div>
                    <div className="col-md-3"></div>
                  </div>
                </div>
              </div>
            </header>
          </section>
          <section className="home-tab">
            <div className="container-fluid">
              <div className="row">
                <header className="header-main"></header>
                <div className="">
                  <div className="tabs-custom general">
                    <div id="wallet" className="">
                      <div className="row justify-content-center">
                        <div className="">
                          <div className="roadmap-box">
                            <div className="roadmap-box-inner">
                              <h4>LIMITED WHITELISTING</h4>
                              <h6>Price  - {convertedPrice === "" ? "Loading" : convertedPrice} {}ETH </h6>
                              <h4>{numberOfWhitelisted} / 500</h4>
                              {joinedWhitelist ? <h4>You're in Whitelist</h4> : "" }
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row" id="ct-row">
                        <div className="col-md-3">
                          <div className="main-logo"><img className="img-fluid" src="assets/images/logo.gif" alt="*"/>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ct-txt">{currentPrice === "" ? <a href="#" onClick={connectWallet}>CONNECT A WALLET</a> : renderButton() }
                            <h5>Copyright © 2022 Oluju. All rights reserved
                            </h5></div>
                        </div>
                        <div className="col-md-3">
                          <div className="top-links"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
  );
}
// <a href="javascript:;">CONNECT A WALLET</a>

export default App;
