import web3 from './web3';
import CampaignFactory from './build/CampaignFactory.json';

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  '0x41e52802348223bfE2ebdfFB68F9429160c8d2b1'
);

export default instance;
