import React, { useRef, useState } from "react";
import styles from "./ShareLink.module.scss";

interface Props {
    hash: string
}

const ShareLink: React.FC<Props> = ({ hash }) => {
    const shareMessage = 'Share This Route';
    const copiedMessage = 'Link Copied to Clipboard';
    const [buttonLabel, setButtonLabel] = useState<string>(shareMessage);
    const hiddenInput = useRef<HTMLInputElement>(null);

    const onClick = () => {
        if(hiddenInput && hiddenInput.current){
            hiddenInput.current.select();
            document.execCommand("copy");
            setButtonLabel(copiedMessage);
            setTimeout(() => setButtonLabel(shareMessage), 2000);
        }
    };

    if(+hash == 0){  // Hide if no route to share
        return <span />
    }

    return (
            <div>
                <button
                    onClick={onClick}
                    className={styles.sharebtn}
                >
                    {buttonLabel}
                </button>
                <input 
                    className={styles.hiddeninput}
                    type="text" 
                    value={
                        process.env.PUBLIC_URL + "#" + hash
                    } 
                    readOnly
                    ref={hiddenInput}
                >
                </input>
            </div>
            );
}

export default ShareLink;