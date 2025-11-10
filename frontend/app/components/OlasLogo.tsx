import type { NextPage } from 'next';
import Image from "next/image";
import styles from './OlasLogo.module.css';
import OlasLogoSvg from '../assets/olas-logo.svg';

const OlasLogo: NextPage = () => {
    return (
        <Image
            className={styles.olasLogoIcon}
            src={OlasLogoSvg}
            width={38.1}
            height={35.7}
            sizes="100vw"
            alt="Olas Logo"
        />
    );
};

export default OlasLogo;
