const box = document.querySelector(".alert");
const loader = document.querySelector(".loadingscreen");
loader.show = () => loader.classList.add("show");
loader.hide = () => loader.classList.remove("show");
const error = {
  store: [],
  isDisplaying: false,
  closeCall: null,
  success: (msg) => {
    box.classList.add("success");
    document.querySelector(".tag").innerHTML = "Success: ";
    error.display(msg);
  },
  display: (msg) => {
    if (error.isDisplaying) {
      error.store.push(msg);
      return;
    }
    document.querySelector(".fillable").innerHTML = msg;
    error.isDisplaying = true;
    box.classList.remove("hide");
    box.classList.add("show");
    error.closeCall = setTimeout(() => error.close(), 3000);
  },
  close: () => {
    box.classList.remove("show");
    box.classList.add("hide");
    error.isDisplaying = false;
    clearTimeout(error.closeCall);
    setTimeout(() => {
      box.classList.remove("success");
      document.querySelector(".tag").innerHTML = "Error: ";
      if (error.store.length > 0) {
        error.display(error.store[0]);
        error.store.splice(0, 1);
      }
    }, 1500);
  },
};
document.querySelector(".close-btn").addEventListener("click", error.close);
let inputFields = {};
const updateState = (ev, ID) => {
  const { name, value } = ev.target;
  inputFields[ID] = { ...inputFields[ID], [name]: value };
};
const fieldRow = (
  user = "",
  phoneNumber = "",
  currencyCode = "NGN",
  amount = 100
) => {
  const fields = document.querySelector(".fields");
  const ID = `fieldRow_${Math.floor(Math.random() * 1000000000)}`;
  let markup = document.createElement("div");
  markup.setAttribute("id", ID);
  markup.setAttribute("class", "field-row");
  const fieldAlert = document.createElement("p");
  fieldAlert.setAttribute("class", "field-alert");
  markup.prepend(fieldAlert);
  const createInput = (type, name, placeholder, value) => {
    const inp = document.createElement("input");
    inp.setAttribute("type", type);
    inp.setAttribute("class", `${name};${ID}`);
    if ((name === "username" && value.length > 0) || name !== "username") {
      inp.setAttribute("value", value);
    }
    inp.setAttribute("placeholder", placeholder);
    return inp;
  };
  const inputs = document.createElement("div");
  inputs.setAttribute("class", "inputs");
  inputs.append(
    createInput("text", "username", "user (@script) optional", user)
  );
  inputs.append(
    createInput("text", "phoneNumber", "phone (+234816245214)", phoneNumber)
  );
  inputs.append(
    createInput("text", "currencyCode", "Currency code (NGN)", currencyCode)
  );
  inputs.append(createInput("number", "amount", "amount (100)", amount));
  markup.append(inputs);
  inputFields = {
    ...inputFields,
    [ID]: {
      username: "",
      phoneNumber: "",
      currencyCode: "NGN",
      amount: 100,
      ID,
    },
  };
  fields.prepend(markup);
  document.querySelectorAll("input").forEach((elem) => {
    elem.addEventListener("input", function (ev) {
      const { value, className } = ev.target;
      const name = className.split(";")[0];
      const ID = className.split(";")[1];
      inputFields[ID] = { ...inputFields[ID], [name]: value };
    });
  });
};
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      const res = reader.result + "";
      let t = res.split(";");
      t = t[1].split(",");

      resolve(t[1]);
    };
    reader.onerror = (error) => reject(error);
  });

document.querySelectorAll("button")[1].addEventListener("click", fieldRow);

document.querySelector("#base64").addEventListener("input", function (ev) {
  const { files } = ev.target;
  toBase64(files[0])
    .then((data) => {
      loader.show();
      return fetch(`${window.location.href}api/spreadsheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "applicaton/json",
        },
        body: JSON.stringify({ base64: data }),
      });
    })
    .then((data) => data.json())
    .then((res) => {
      if (!res.status || res.status >= 400) {
        throw new Error(res.message);
      }
      loader.hide();
      res.data.forEach((elem) =>
        fieldRow(
          elem.username,
          elem.phoneNumber,
          elem.currencyCode,
          elem.amount
        )
      );
    })
    .catch((err) => {
      error.display(err.message);
      loader.hide();
    });
});

document.querySelectorAll("button")[0].addEventListener("click", function () {
  const recipients = Object.values(inputFields);
  loader.show();
  fetch(`${window.location.href}api/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ recipients }),
  })
    .then((data) => data.json())
    .then((res) => {
      if (!res.status || res.status >= 400) {
        throw new Error(res.message);
      }
      loader.hide();
      if (res.numSent < Object.values(inputFields)) {
        error.display(
          `${
            Object.values(inputFields).length - res.numSent
          } aritime was not disbursed. scroll through list for failures.`
        );
      } else {
        error.success("All airtime successfully disbursed");
      }
      res.responses &&
        Array.isArray(res.responses) &&
        res.responses.forEach((elem) => {
          const { ID } = elem;
          if (
            (elem.status && elem.status.toLowerCase !== "sent") ||
            elem.errorMessage !== "None"
          ) {
            document.querySelector(`#${ID} .field-alert`).innerHTML =
              elem.errorMessage;
          }
        });
    })
    .catch((err) => {
      error.display(err.message);
      loader.hide();
    });
});
fieldRow();
