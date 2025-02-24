<template>
    <label class="toggle">
      <input type="checkbox" v-model="isChecked" @change="toggleSwitch" />
      <div class="off-knob"></div>
      <div class="on-knob"></div>
      <svg viewBox="0 0 44 22" xmlns="http://www.w3.org/2000/svg">
        <rect
          class="outline"
          fill="none"
          rx="11"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="1"
        />
        <rect
          class="outline outline--blur"
          fill="none"
          rx="11"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="1"
        />
      </svg>
    </label>
  </template>
  
  <script>
  export default {
    name: "SwitchButton",
    props: {
      isExploded: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        isChecked: this.isExploded, // 双向绑定初始状态
      };
    },
    watch: {
      isChecked(newVal) {
        this.$emit("update:isExploded", newVal); // 向父组件发送更新的状态
      },
    },
    methods: {
      toggleSwitch() {
        if (this.isChecked) {
          this.animateOffKnobCheck();
          this.animateOnKnobCheck();
          this.animateOutlineCheck();
        } else {
          this.animateOffKnobUncheck();
          this.animateOnKnobUncheck();
          this.animateOutlineUncheck();
        }
      },
      animateOffKnobCheck() {
        this.$refs.offKnob.animate(
          [
            {
              transform: "scale(1) translateX(0)",
            },
            {
              transform: "scale(0.1)",
              background: "var(--on-color)",
              offset: 0.6,
            },
            {
              transform: "scale(0.1) translateX(-430px)",
              background: "var(--on-color)",
            },
          ],
          {
            duration: 500,
            easing: "cubic-bezier(0.44,-0.44,0.98,0.89)",
            fill: "forwards",
          }
        );
      },
      animateOffKnobUncheck() {
        this.$refs.offKnob.animate(
          [
            {
              transform: "scale(0.1) translateX(-430px)",
              background: "var(--off-color)",
            },
            {
              transform: "scale(0.1) translateX(0)",
              background: "var(--off-color)",
              offset: 0.4,
            },
            {
              transform: "scale(1.05) translateX(0)",
              background: "var(--off-color)",
              offset: 0.7,
            },
            {
              transform: "scale(0.87) translateX(0)",
              background: "var(--off-color)",
              offset: 0.8,
            },
            {
              transform: "scale(1.01) translateX(0)",
              background: "var(--off-color)",
              offset: 0.9,
            },
            {
              transform: "scale(1) translateX(0)",
              background: "var(--off-color)",
            },
          ],
          {
            duration: 500,
            easing: "ease-out",
            delay: 1000,
            fill: "forwards",
          }
        );
      },
      animateOnKnobCheck() {
        this.$refs.onKnob.animate(
          [
            {
              background: "var(--on-color)",
            },
            {
              transform: "translateX(0) scale(0.1)",
              background: "var(--on-color)",
              offset: 0.4,
            },
            {
              transform: "translateX(0) scale(1.05)",
              background: "var(--on-color)",
              offset: 0.7,
            },
            {
              transform: "translateX(0) scale(0.87)",
              background: "var(--on-color)",
              offset: 0.8,
            },
            {
              transform: "translateX(0) scale(1.01)",
              background: "var(--on-color)",
              offset: 0.9,
            },
            {
              transform: "translateX(0) scale(1)",
              background: "var(--on-color)",
            },
          ],
          {
            duration: 500,
            easing: "ease-out",
            delay: 1000,
            fill: "forwards",
          }
        );
      },
      animateOnKnobUncheck() {
        this.$refs.onKnob.animate(
          [
            {
              transform: "scale(0.1) translateX(0)",
              background: "var(--off-color)",
              offset: 0.6,
            },
            {
              transform: "scale(0.1) translateX(430px)",
              background: "var(--off-color)",
            },
          ],
          {
            duration: 500,
            easing: "cubic-bezier(0.44,-0.44,0.98,0.89)",
            fill: "forwards",
          }
        );
      },
      animateOutlineCheck() {
        const keyframes = [
          {
            strokeOpacity: 1,
          },
          {
            strokeOpacity: 1,
            offset: 0.99,
          },
          {
            strokeOpacity: 0,
            strokeDashoffset: 89,
          },
        ];
        const options = {
          duration: 500,
          easing: "cubic-bezier(0.55,0.055,0.9,1)",
          delay: 500,
          fill: "forwards",
        };
        this.$refs.outline.animate(keyframes, options);
        this.$refs.outlineBlur.animate(keyframes, options);
      },
      animateOutlineUncheck() {
        const keyframes = [
          {
            strokeOpacity: 1,
            strokeDashoffset: 89,
          },
          {
            strokeOpacity: 1,
            strokeDashoffset: 32.5,
            offset: 0.99,
          },
          {
            strokeOpacity: 0,
            strokeDashoffset: 32.5,
          },
        ];
        const options = {
          duration: 500,
          easing: "cubic-bezier(0.55,0.055,0.9,1)",
          delay: 500,
          fill: "forwards",
        };
        this.$refs.outline.animate(keyframes, options);
        this.$refs.outlineBlur.animate(keyframes, options);
      },
    },
  };
  </script>
  
  <style scoped>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :root {
    --on-color: #0085ff;
    --off-color: #cce7ff;
    --toggle-bg: #1f3447;
    --toggle-gap: 10px;
    --toggle-width: 160px;
    --transition-color: var(--off-color);
  }
  body {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #00182e;
  }
  .toggle {
    position: relative;
    cursor: pointer;
    background: var(--toggle-bg);
    width: var(--toggle-width);
    height: calc(var(--toggle-width) / 2);
    border-radius: 160px;
    overflow: hidden;
    display: flex;
    align-items: center;
    box-shadow: inset 0 0 2px #7c7e8855;
  }
  .toggle input {
    appearance: none;
  }
  .off-knob,
  .on-knob {
    position: absolute;
    height: calc(100% - var(--toggle-gap) * 2);
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: 0 1px 1px rgba(10, 19, 39, 0.1),
      0 4px 12px rgba(10, 19, 39, 0.03),
      0 4px 20px rgba(10, 19, 39, 0.04);
    transform-origin: center center;
  }
  .off-knob {
    left: var(--toggle-gap);
    background: var(--off-color);
  }
  .on-knob {
    right: var(--toggle-gap);
    background: var(--on-color);
    transform: scale(0.1) translateX(430px);
  }
  svg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .outline {
    width: 100%;
    height: 100%;
    stroke: var(--transition-color);
    stroke-dasharray: 2 125;
    stroke-dashoffset: 32.5;
    stroke-opacity: 0;
  }
  .outline--blur {
    filter: blur(0.8px);
  }
  </style>
  